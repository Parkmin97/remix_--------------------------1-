import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, User as UserIcon, Camera, Pencil, LogOut, Trash2, Lock, Loader2, AlertTriangle, Check, ImagePlus } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase, deleteAccountOnServer } from '../lib/supabase';
import { getLocalAvatar, saveLocalAvatar, clearLocalAvatar, clearAllData } from '../lib/storage';

/** 사진을 담아둘 한 변의 최대 길이(px). 화면에는 64px로 보이지만 고해상도 대비로 넉넉히 잡는다. */
const AVATAR_MAX_PX = 256;

/**
 * 갤러리에서 고른 원본 사진을 정사각형으로 잘라 축소·압축한다.
 *
 * ⚠️ 폰 사진은 한 장에 수 MB다. 원본을 그대로 data URL 로 만들면
 *    localStorage 용량을 바로 넘겨 저장이 통째로 실패한다. 반드시 줄여서 넣는다.
 */
async function toSquareDataUrl(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('이미지를 읽지 못했습니다.'));
      el.src = objectUrl;
    });

    // 짧은 변 기준으로 가운데를 정사각형으로 잘라낸다(원형 아바타에 맞춘다).
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - side) / 2;
    const sy = (img.naturalHeight - side) / 2;
    const target = Math.min(side, AVATAR_MAX_PX);

    const canvas = document.createElement('canvas');
    canvas.width = target;
    canvas.height = target;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('이미지를 처리하지 못했습니다.');
    ctx.drawImage(img, sx, sy, side, side, 0, 0, target, target);

    return canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

interface ProfileSettingsScreenProps {
  onBack: () => void;
  lockRunning?: boolean;
}

export const ProfileSettingsScreen: React.FC<ProfileSettingsScreenProps> = ({ onBack, lockRunning = false }) => {
  const [user, setUser] = useState<User | null>(null);

  // 닉네임 수정 관련 상태
  const [showNicknameEdit, setShowNicknameEdit] = useState<boolean>(false);
  const [nicknameInput, setNicknameInput] = useState<string>('');
  const [savingNickname, setSavingNickname] = useState<boolean>(false);
  const [nicknameError, setNicknameError] = useState<string | null>(null);

  // 프로필 사진 변경 관련 상태
  const [showAvatarEdit, setShowAvatarEdit] = useState<boolean>(false);
  /** 모달에서 미리보기 중인 사진(data URL). 저장을 눌러야 실제로 반영된다. */
  const [avatarDraft, setAvatarDraft] = useState<string | null>(null);
  const [savingAvatar, setSavingAvatar] = useState<boolean>(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  /** 기기에 저장된 프로필 사진. 서버에 올리지 않고 이 폰에만 둔다. */
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 로그아웃 관련 상태
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const [loggingOut, setLoggingOut] = useState<boolean>(false);

  // 회원 탈퇴 관련 상태
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [deletingAccount, setDeletingAccount] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // 계정이 정해지면 그 계정의 사진을 기기에서 읽어온다.
  // 계정별로 따로 보관하므로 한 폰에서 계정을 바꾸면 사진도 함께 바뀐다.
  useEffect(() => {
    setLocalAvatar(getLocalAvatar(user?.id));
  }, [user?.id]);

  const nickname = user?.user_metadata?.nickname || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : '클래식 지휘자');
  const email = user?.email || 'user@example.com';
  // 기기에 저장한 사진이 우선. 없으면 예전에 URL 로 지정해둔 사진, 그것도 없으면 기본 아이콘.
  const avatarUrl = localAvatar || user?.user_metadata?.avatar_url || null;

  // 닉네임 저장
  const handleSaveNickname = async () => {
    const next = nicknameInput.trim();
    if (!next) {
      setNicknameError('닉네임을 입력해주세요.');
      return;
    }
    if (next.length > 20) {
      setNicknameError('닉네임은 20자 이내로 입력해주세요.');
      return;
    }
    setSavingNickname(true);
    setNicknameError(null);
    const { data, error } = await supabase.auth.updateUser({ data: { nickname: next } });
    setSavingNickname(false);
    if (error) {
      setNicknameError('닉네임 저장에 실패했어요.');
      return;
    }
    if (data.user) setUser(data.user);
    setShowNicknameEdit(false);
  };

  // 갤러리에서 사진을 고르면 정사각형으로 줄여 미리보기에 올린다. 저장은 아직 하지 않는다.
  const handlePickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // 같은 사진을 다시 고를 수 있도록 입력값을 비운다(값이 같으면 change 가 안 뜬다).
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError('이미지 파일만 선택할 수 있어요.');
      return;
    }

    setAvatarError(null);
    try {
      setAvatarDraft(await toSquareDataUrl(file));
    } catch {
      setAvatarError('사진을 불러오지 못했어요. 다른 사진을 골라주세요.');
    }
  };

  // 프로필 사진 저장 (이 기기에만)
  const handleSaveAvatar = () => {
    if (!user?.id) {
      setAvatarError('로그인 정보를 확인하지 못했어요.');
      return;
    }
    setSavingAvatar(true);
    setAvatarError(null);

    if (avatarDraft) {
      if (!saveLocalAvatar(user.id, avatarDraft)) {
        setSavingAvatar(false);
        setAvatarError('사진을 저장할 공간이 부족해요. 다른 사진을 골라주세요.');
        return;
      }
      setLocalAvatar(avatarDraft);
    } else {
      // 미리보기가 비어 있으면 "기본 이미지로 되돌리기"다.
      clearLocalAvatar(user.id);
      setLocalAvatar(null);
    }

    setSavingAvatar(false);
    setAvatarDraft(null);
    setShowAvatarEdit(false);
  };

  // 로그아웃 처리
  const handleLogout = async () => {
    if (lockRunning) return;
    setLoggingOut(true);
    await supabase.auth.signOut();
    setLoggingOut(false);
    setShowLogoutConfirm(false);
  };

  // 회원 탈퇴 처리
  /**
   * 회원 탈퇴.
   *
   * ⚠️ 로그아웃과 다르다. 로그아웃은 세션만 끊고 계정은 남지만,
   *    탈퇴는 서버의 계정과 데이터를 지운 뒤에야 로그아웃한다.
   *
   * 순서가 중요하다 — 삭제가 성공한 다음에 로그아웃한다.
   * 먼저 로그아웃하면 토큰이 사라져 서버에 본인임을 증명할 수 없게 되고,
   * 계정은 남았는데 사용자는 지워졌다고 믿는 최악의 상태가 된다.
   */
  const handleDeleteAccount = async () => {
    // 잠금이 도는 중에는 탈퇴가 차단 우회로가 된다. 막는다.
    if (lockRunning) return;

    setDeletingAccount(true);
    setDeleteError(null);

    const result = await deleteAccountOnServer();

    if (!result.ok) {
      setDeletingAccount(false);
      setDeleteError(result.message ?? '탈퇴 처리에 실패했습니다. 다시 시도해주세요.');
      return;
    }

    // 서버에서 지워진 것을 확인한 뒤에만 이 기기의 흔적을 지운다.
    if (user?.id) clearLocalAvatar(user.id);
    clearAllData();

    await supabase.auth.signOut();
    setDeletingAccount(false);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="min-h-full flex flex-col max-w-2xl mx-auto w-full px-4 py-4 gap-4 text-black relative select-none pb-20">
      {/* 1. 상단 뒤로가기 & 서브 타이틀 */}
      <div className="flex items-center gap-3 shrink-0 pt-0.5 pb-1">
        <button
          onClick={onBack}
          className="p-2 rounded-2xl bg-white border border-slate-200 hover:bg-slate-100 text-black transition-colors active:scale-95 shadow-sm cursor-pointer"
          title="뒤로가기"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="w-4 h-4 text-black" />
        </button>
        <h2 className="text-base sm:text-lg font-sans font-extrabold text-black tracking-wide">
          프로필 설정
        </h2>
      </div>

      {/* 2. 메인 프로필 카드 */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-4">
        {/* 프로필 아바타 & 변경 버튼 */}
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-full bg-neutral-900 border-2 border-[#FE9A00] flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md">
            {avatarUrl ? (
              <img src={avatarUrl} alt="프로필 사진" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-8 h-8 text-[#FE9A00]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-black truncate">{nickname}</h3>
            <p className="text-xs text-slate-500 font-mono truncate mt-0.5">{email}</p>
          </div>
          <button
            onClick={() => {
              setAvatarDraft(avatarUrl);
              setAvatarError(null);
              setShowAvatarEdit(true);
            }}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-black font-bold text-xs border border-slate-200 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-[#FE9A00]" />
            <span>사진 변경</span>
          </button>
        </div>

        <hr className="border-slate-100" />

        {/* 닉네임 수정 항목 */}
        <div className="flex items-center justify-between py-1">
          <div>
            <span className="text-xs text-slate-400 font-medium">닉네임</span>
            <p className="text-sm font-bold text-black mt-0.5">{nickname}</p>
          </div>
          <button
            onClick={() => {
              setNicknameInput(nickname);
              setNicknameError(null);
              setShowNicknameEdit(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-black font-bold text-xs border border-slate-200 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5 text-[#FE9A00]" />
            <span>수정</span>
          </button>
        </div>
      </div>

      {/* 3. 계정 관련 작업 (로그아웃 & 회원 탈퇴) */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">계정 관리</h3>

        {/* 잠금 중 안내 메시지 */}
        {lockRunning && (
          <div className="flex items-start gap-2 rounded-2xl border border-[#FE9A00]/40 bg-[#FE9A00]/10 px-4 py-3 shrink-0">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#FE9A00]" />
            <p className="text-xs leading-snug text-black/80 break-keep">
              <span className="font-bold text-black">잠금이 실행 중입니다.</span><br />
              로그아웃 및 회원 탈퇴는 잠금이 종료되거나 지휘 미션에 성공한 후 가능합니다.
            </p>
          </div>
        )}

        {/* 로그아웃 버튼 */}
        <button
          onClick={() => { if (!lockRunning) setShowLogoutConfirm(true); }}
          disabled={lockRunning}
          className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-black hover:text-white border border-slate-200 text-xs sm:text-sm font-bold text-black transition-all flex items-center justify-between group active:scale-98 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-50 disabled:hover:text-black"
        >
          <div className="flex items-center gap-2.5">
            {lockRunning ? <Lock className="w-4 h-4 text-[#FE9A00]" /> : <LogOut className="w-4 h-4 text-[#FE9A00]" />}
            <span>로그아웃</span>
          </div>
        </button>

        {/* 회원 탈퇴 버튼 */}
        <button
          onClick={() => { if (!lockRunning) setShowDeleteConfirm(true); }}
          disabled={lockRunning}
          className="w-full p-3.5 rounded-2xl bg-rose-50 hover:bg-rose-600 hover:text-white border border-rose-100 text-xs sm:text-sm font-bold text-rose-600 transition-all flex items-center justify-between group active:scale-98 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-rose-50 disabled:hover:text-rose-600"
        >
          <div className="flex items-center gap-2.5">
            <Trash2 className="w-4 h-4 text-rose-500 group-hover:text-white transition-colors" />
            <span>회원 탈퇴</span>
          </div>
        </button>
      </div>

      {/* 닉네임 수정 모달 */}
      {showNicknameEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm px-6 animate-fade-in">
          <div className="w-full max-w-xs rounded-3xl border border-amber-500/30 bg-stone-900 p-6 shadow-2xl">
            <div className="flex items-center gap-2 justify-center">
              <Pencil className="h-5 w-5 text-amber-400" />
              <h2 className="font-serif text-lg font-bold text-amber-100">닉네임 수정</h2>
            </div>
            <p className="mt-1.5 text-center text-xs text-stone-400 break-keep">
              앱에서 표시될 새로운 닉네임을 입력해주세요.
            </p>
            <input
              type="text"
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveNickname(); }}
              maxLength={20}
              autoFocus
              placeholder="닉네임 (최대 20자)"
              className="mt-4 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-amber-500 transition-colors"
            />
            {nicknameError && (
              <p className="mt-2 text-xs text-rose-400 break-keep">{nicknameError}</p>
            )}
            <div className="mt-5 flex gap-2.5">
              <button
                onClick={() => setShowNicknameEdit(false)}
                disabled={savingNickname}
                className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-sm font-semibold border border-stone-700 transition-colors disabled:opacity-60 cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleSaveNickname}
                disabled={savingNickname}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-sm font-bold transition-colors active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {savingNickname ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 프로필 사진 수정 모달 */}
      {showAvatarEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm px-6 animate-fade-in">
          <div className="w-full max-w-xs rounded-3xl border border-amber-500/30 bg-stone-900 p-6 shadow-2xl">
            <div className="flex items-center gap-2 justify-center">
              <Camera className="h-5 w-5 text-amber-400" />
              <h2 className="font-serif text-lg font-bold text-amber-100">프로필 사진 설정</h2>
            </div>
            <p className="mt-1.5 text-center text-xs text-stone-400 break-keep">
              갤러리에서 사진을 선택해주세요. 사진은 이 기기에만 저장되며 서버로 전송되지 않습니다.
            </p>

            {/* 갤러리 열기. 안드로이드 웹뷰가 시스템 사진 선택기를 띄운다. */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePickFile}
              className="hidden"
            />

            {/* 미리보기 — 누르면 다시 고를 수 있다 */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-amber-500/50 bg-stone-950 transition-colors hover:border-amber-400 cursor-pointer"
            >
              {avatarDraft ? (
                <img src={avatarDraft} alt="선택한 사진 미리보기" className="h-full w-full object-cover" />
              ) : (
                <UserIcon className="h-12 w-12 text-stone-600" />
              )}
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 w-full rounded-xl border border-stone-700 bg-stone-800 py-2.5 text-sm font-semibold text-stone-100 transition-colors hover:bg-stone-700 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ImagePlus className="h-4 w-4 text-amber-400" />
              갤러리에서 사진 선택
            </button>

            {avatarDraft && (
              <button
                type="button"
                onClick={() => { setAvatarDraft(null); setAvatarError(null); }}
                className="mt-2 w-full rounded-xl py-2 text-xs font-semibold text-stone-400 transition-colors hover:text-stone-200 cursor-pointer"
              >
                기본 이미지로 되돌리기
              </button>
            )}

            {avatarError && (
              <p className="mt-2 text-xs text-rose-400 break-keep">{avatarError}</p>
            )}
            <div className="mt-5 flex gap-2.5">
              <button
                onClick={() => setShowAvatarEdit(false)}
                disabled={savingAvatar}
                className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-sm font-semibold border border-stone-700 transition-colors disabled:opacity-60 cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleSaveAvatar}
                disabled={savingAvatar}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-sm font-bold transition-colors active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {savingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 로그아웃 확인 모달 */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm px-6 animate-fade-in">
          <div className="w-full max-w-xs rounded-3xl border border-amber-500/30 bg-stone-900 p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/15 text-amber-400">
              <LogOut className="h-7 w-7" />
            </div>
            <h2 className="mt-4 font-serif text-lg font-bold text-amber-100 break-keep">로그아웃하시겠어요?</h2>
            <p className="mt-1.5 text-xs leading-snug text-stone-400 break-keep">
              로그아웃하면 로그인 화면으로 돌아갑니다.
            </p>
            <div className="mt-6 flex gap-2.5">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                disabled={loggingOut}
                className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-sm font-semibold border border-stone-700 transition-colors disabled:opacity-60 cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-sm font-bold transition-colors active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 회원 탈퇴 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm px-6 animate-fade-in">
          <div className="w-full max-w-xs rounded-3xl border border-rose-500/30 bg-stone-900 p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-rose-500/40 bg-rose-500/15 text-rose-400">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h2 className="mt-4 font-serif text-lg font-bold text-rose-100 break-keep">정말 탈퇴하시겠습니까?</h2>
            <p className="mt-1.5 text-xs leading-snug text-stone-400 break-keep">
              계정과 지금까지의 잠금 기록·리포트가 <strong className="text-rose-300">영구적으로 삭제</strong>되며,
              되돌릴 수 없습니다. 잠시 쉬려는 것이라면 탈퇴 대신 로그아웃을 이용해주세요.
            </p>
            {deleteError && (
              <p className="mt-2 text-xs text-rose-400 break-keep">{deleteError}</p>
            )}
            <div className="mt-6 flex gap-2.5">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deletingAccount}
                className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-sm font-semibold border border-stone-700 transition-colors disabled:opacity-60 cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold transition-colors active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {deletingAccount ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                탈퇴하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
