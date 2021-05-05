import fetch from 'node-fetch';

import BaseProcess, { Status } from './BaseProcess';

// 9050 is the default port of the tor process.
export const DEFAULT_ADDRESS = '127.0.0.1:9050';

class TorProcess extends BaseProcess {
    constructor() {
        super('tor', 'tor');
    }

    async status(): Promise<Status> {
        // service
        try {
            const resp = await fetch(`http://${DEFAULT_ADDRESS}/`);
            if (resp.status === 501 && resp.statusText.startsWith('Tor')) {
                return {
                    service: true,
                    process: true,
                };
            }
        } catch {
            //
        }

        // process
        return {
            service: false,
            process: Boolean(this.process),
        };
    }

    async start(): Promise<void> {
        await super.start(['-f', 'torrc']);
    }
}

export default TorProcess;
