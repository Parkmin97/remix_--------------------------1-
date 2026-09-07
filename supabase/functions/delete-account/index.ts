/**
 * 회원 탈퇴 (계정 + 서버 데이터 완전 삭제).
 *
 * ■ 왜 서버 함수가 필요한가
 *   계정 삭제는 service_role 권한이 있어야 한다. 그 키를 앱에 넣으면
 *   APK 에서 추출돼 누구나 남의 계정을 지울 수 있으므로, 절대 클라이언트에 두지 않는다.
 *   그래서 이 함수만 service_role 을 쥐고, 호출자는 자기 JWT 로 본인임을 증명한다.
 *
 * ■ 무엇을 지우는가
 *   호출한 본인의 daily_reports · lock_histories · session_decisions 행 전부,
 *   그리고 인증 계정 자체. 다른 사람의 데이터는 건드릴 수 없다(항상 토큰의 user.id 로만 지운다).
 *
 * ■ Google Play 요건
 *   계정 생성을 받는 앱은 앱 안에서 계정을 지울 수 있어야 한다.
 *   이 함수가 그 요건의 서버 쪽 절반이다.
 *
 * 배포: supabase functions deploy delete-account
 *   SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY 는 Edge Function 런타임이 자동으로 넣어준다.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** 이 사용자의 흔적이 남는 테이블. 새 테이블을 만들면 여기에 반드시 추가한다. */
const USER_TABLES = ['daily_reports', 'lock_histories', 'session_decisions'];

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'POST 만 허용됩니다.' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[delete-account] 런타임 환경변수가 없습니다.');
    return json({ error: '서버 설정이 올바르지 않습니다.' }, 500);
  }

  // 1) 호출자가 누구인지 확인한다. 토큰이 말하는 사람 외에는 아무도 지울 수 없다.
  const authHeader = req.headers.get('Authorization') ?? '';
  const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!accessToken) {
    return json({ error: '로그인이 필요합니다.' }, 401);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userData, error: userError } = await admin.auth.getUser(accessToken);
  const user = userData?.user;
  if (userError || !user) {
    return json({ error: '로그인 정보가 유효하지 않습니다.' }, 401);
  }

  // 2) 이 사용자의 데이터 행을 먼저 지운다.
  //    계정을 먼저 지우면 남은 행의 주인을 특정할 수 없게 되므로 순서를 바꾸지 않는다.
  const failedTables: string[] = [];
  for (const table of USER_TABLES) {
    const { error } = await admin.from(table).delete().eq('user_id', user.id);
    if (error) {
      // 테이블이 아직 없을 수 있다(미생성). 그건 지울 것이 없다는 뜻이므로 실패로 보지 않는다.
      if (error.code === '42P01') {
        console.warn(`[delete-account] ${table} 테이블 없음 — 건너뜀`);
        continue;
      }
      console.error(`[delete-account] ${table} 삭제 실패:`, error.message);
      failedTables.push(table);
    }
  }

  // 데이터가 남았는데 계정만 지우면 주인 없는 개인정보가 남는다. 그건 더 나쁘다.
  if (failedTables.length > 0) {
    return json(
      { error: '데이터 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.', failedTables },
      500,
    );
  }

  // 3) 마지막으로 인증 계정을 지운다.
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error('[delete-account] 계정 삭제 실패:', deleteError.message);
    return json({ error: '계정 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.' }, 500);
  }

  console.info(`[delete-account] 탈퇴 완료: ${user.id}`);
  return json({ ok: true }, 200);
});
