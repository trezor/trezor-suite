import fetch from 'node-fetch';

import BaseProcess, { Status } from './BaseProcess';

class BridgeProcess extends BaseProcess {
    constructor() {
        super('bridge', 'trezord', {
            startupCooldown: 3,
        });
    }

    async status(): Promise<Status> {
        // service
        try {
            const resp = await fetch(`http://127.0.0.1:21325/`, {
                method: 'POST',
                headers: {
                    Origin: 'https://electron.trezor.io',
                },
            });
            this.logger.debug(this.logTopic, `Checking status (${resp.status})`);
            if (resp.status === 200) {
                const data = await resp.json();
                if (data?.version) {
                    return {
                        service: true,
                        process: true,
                    };
                }
            }
        } catch (err) {
            this.logger.error(this.logTopic, `Status error: ${err.message}`);
        }

        // process
        return {
            service: false,
            process: Boolean(this.process),
        };
    }

    async startDev(): Promise<void> {
        await super.start(['-e', '21324']);
    }
}

export default BridgeProcess;
