from http.server import SimpleHTTPRequestHandler, HTTPServer
import os


class SecurityHeadersHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # COOP
        self.send_header(
            "Cross-Origin-Opener-Policy",
            "same-origin"
        )

        super().end_headers()


os.chdir("build")

server = HTTPServer(("localhost", 8000), SecurityHeadersHandler)
print("Serving at http://localhost:8000")
server.serve_forever()