import http.server
import socketserver
import os

PORT = 5173
os.chdir(os.path.dirname(os.path.abspath(__file__)))

Handler = http.server.SimpleHTTPRequestHandler
Handler.extensions_map.update({
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
})

print(f"Server starting on port {PORT}...")
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()
