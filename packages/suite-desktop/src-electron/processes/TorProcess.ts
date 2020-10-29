import fetch from 'node-fetch';

import BaseProcess, { Status } from './BaseProcess';

class TorProcess extends BaseProcess {
    adr = '127.0.0.1:9050';

    constructor() {
        super('tor', 'tor');
    }

    get address() {
        return this.adr;
    }

    set address(value: string) {
        this.adr = value;
    }

    async status(): Promise<Status> {
        // service
        try {
            const resp = await fetch(`http://${this.adr}/`);
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
}

export default TorProcess;
