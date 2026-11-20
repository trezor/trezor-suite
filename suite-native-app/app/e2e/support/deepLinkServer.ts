import http from 'http';

import TrezorConnect from '@trezor/connect-mobile';

export class DeepLinkServer {
    private server?: http.Server;
    readonly port = 8080;
    readonly url = `http://localhost:${this.port}`;

    async start() {
        if (this.server && this.server.listening) {
            return;
        }

        await new Promise<void>(resolve => {
            this.server = http.createServer((req, res) => {
                if (req.url) {
                    const url = new URL(req.url, this.url);
                    TrezorConnect.handleDeeplink(url.href);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'text/plain');
                    res.end('Callback URL received successfully!\n');
                }
            });

            this.server.listen(this.port, 'localhost', () => {
                // eslint-disable-next-line no-console
                console.info(`Server running at ${this.url}`);
                resolve();
            });
        });
    }

    async stop(): Promise<void> {
        if (!this.server) return;

        await new Promise<void>(resolve => {
            this.server!.close(() => resolve());
            this.server!.closeAllConnections();
        });

        this.server = undefined;
    }
}
