import fetch from 'node-fetch';

import BaseProcess, { Status } from './BaseProcess';

const defaultTorAddress = '127.0.0.1:9050';

class TorProcess extends BaseProcess {
    adr = defaultTorAddress;

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

    async start(): Promise<void> {
        // Only try to start the process if it's the default Tor address.
        // Otherwise the user might be pointing to a different instance.
        if (this.adr === defaultTorAddress) {
            await super.start();
        }
    }
}

export default TorProcess;
