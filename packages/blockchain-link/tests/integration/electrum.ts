/// <reference path="../../../suite/global.d.ts" />

import ElectrumModule from '../../src/workers/electrum';
import type { Message, Response } from '../../src/types';

const TCP_CONFIG = '127.0.0.1:50001:t';

describe('Electrum', () => {
    let worker: ReturnType<typeof ElectrumModule>;
    const resolvers: { [id: number]: (value: any) => void } = {};
    let id = 0;

    const sendAndWait = (data: Message) =>
        new Promise(resolve => {
            resolvers[data.id] = resolve;
            worker.postMessage(data);
        });

    beforeEach(() => {
        worker = ElectrumModule();
        worker.onmessage = ({ data }: { data: Response }) => {
            console.log('ONMESSAGE', JSON.stringify(data, null, 4));
            if (resolvers[data.id]) {
                resolvers[data.id](data);
            }
        };

        worker.postMessage({
            type: 'm_handshake',
            id: 0,
            settings: {
                name: 'Electrum',
                worker: 'unknown',
                server: [TCP_CONFIG],
                debug: true,
            },
        });
    });

    it('Connect to electrum', async () => {
        console.log('before waited !!!');
        const testId = ++id;
        const waited = await sendAndWait({ id: testId, type: 'm_connect' });
        console.log('waited', waited);
        expect(waited).toEqual({ id: testId, type: 'r_connect', payload: true });
    });

    it('Get account info', async () => {
        console.log('Getting account info test');
        const address = '3AVjhFvVHKhPfFccdFnPTBaqRqWq4EWoU2';
        const testId = ++id;
        const waited = await sendAndWait({
            id: testId,
            type: 'm_get_account_info',
            payload: { descriptor: address, details: 'txs' },
        });
        console.log('waited', waited);
        expect(waited).toEqual({
            id: testId,
            type: 'r_account_info',
            payload: {
                descriptor: address,
                balance: '0',
                availableBalance: '0',
                empty: true,
                history: { total: 0, unconfirmed: 0, transactions: [] },
                page: { index: 1, size: 25, total: 1 },
            },
        });
    });
});
