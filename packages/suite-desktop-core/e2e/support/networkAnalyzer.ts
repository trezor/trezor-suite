import { exec } from 'child_process';

export class NetworkAnalyzer {
    interval?: string | number | NodeJS.Timer;
    tcp: string[];

    constructor() {
        this.tcp = [];
    }

    checkTCP() {
        return new Promise((resolve, reject) => {
            try {
                // When running in Tests the electron process has name `electron`,
                // but when running without the tests is is `trezor-su`.
                exec('lsof -i TCP | grep electron', (_, stdout) => {
                    const outputGroupParser = (message: string) =>
                        message && message.trim().match(/electron .*/gm);
                    const group = outputGroupParser(stdout);
                    if (group) {
                        const groupParsed = group.map(output => {
                            const parsed = output
                                .trim()
                                .match(/^electron .* TCP.*->(?<url>[\s\S]* )/);

                            return parsed?.groups?.url ?? '';
                        });
                        // Removing empty strings.
                        const requests = groupParsed.filter(entry => entry.trim() !== '');
                        resolve(requests);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    start() {
        this.interval = setInterval(async () => {
            const requests = (await this.checkTCP()) as string[];
            this.tcp.push(...requests);
        }, 1000);
    }

    stop() {
        clearInterval(this.interval);
    }

    getRequests() {
        return this.tcp;
    }
}
