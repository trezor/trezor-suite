import ElectrumWorker from '../../lib/workers/electrum';
import type { Message } from '@trezor/blockchain-link-types/lib/messages';
import type { Response } from '@trezor/blockchain-link-types/lib/responses';
import { GET_ACCOUNT_INFO, HANDSHAKE } from '@trezor/blockchain-link-types/lib/constants/messages';

const TCP_CONFIG = '127.0.0.1:50001:t';
const NETWORK = 'REGTEST';

describe('Electrum', () => {
    const worker = ElectrumWorker();
    const resolvers: { [id: number]: (value: any) => void } = {};
    let id = 1;

    const sendAndWait = (data: Message) =>
        new Promise(resolve => {
            resolvers[data.id] = resolve;
            worker.postMessage(data);
        });

    worker.onmessage = ({ data }: { data: Response }) => {
        if (resolvers[data.id]) {
            resolvers[data.id](data);
        }
    };

    worker.postMessage({
        type: HANDSHAKE,
        id,
        settings: {
            name: NETWORK,
            worker: 'unknown',
            server: [TCP_CONFIG],
            debug: true,
        },
    });

    afterAll(() => {
        worker.cleanup();
    });

    it('Connect to electrum', async () => {
        const testId = ++id;
        const waited = await sendAndWait({ id: testId, type: 'm_connect' });
        expect(waited).toEqual({ id: testId, type: 'r_connect', payload: true });
    });

    it('Get account info return format', async () => {
        const address = 'bcrt1qu0k7jjux76kpgjhnqn4kyfg6yuekhnd246pjlf';
        const testId = ++id;
        const waited = await sendAndWait({
            id: testId,
            type: GET_ACCOUNT_INFO,
            payload: { descriptor: address, details: 'txs' },
        });
        expect(waited).toEqual({
            id: testId,
            type: 'r_account_info',
            payload: {
                descriptor: address,
                balance: '0',
                availableBalance: '0',
                empty: true,
                history: { total: 0, unconfirmed: 0, transactions: [] },
                page: { index: 1, size: 25, total: 0 },
            },
        });
    });
});
