import { TrezorBlockchain } from '@trezor/blockchain-core';

import { type PopupFlowPayload } from './CommonPopupFlow';
import { PushTransaction } from './pushTransaction';

jest.mock('@trezor/blockchain-core', () => ({ TrezorBlockchain: { pushTransaction: jest.fn() } }));

describe('PushTransaction', () => {
    it('broadcasts the transaction through the backends of Suite', async () => {
        const response = { success: true as const, payload: { txid: 'txid' } };
        jest.mocked(TrezorBlockchain.pushTransaction).mockResolvedValue(response);
        const payload: PopupFlowPayload<'pushTransaction'> = {
            coin: 'btc',
            tx: 'deadbeef',
            callId: 'call-id',
        };
        const flow = new PushTransaction(
            {
                method: 'pushTransaction',
                payload,
                source: {
                    type: 'web',
                    origin: 'https://app.example',
                    manifest: { appName: 'app' },
                },
            },
            { dispatch: jest.fn(), getState: jest.fn(), signal: new AbortController().signal },
        );

        await expect(flow['callMethod'](payload)).resolves.toBe(response);
        expect(TrezorBlockchain.pushTransaction).toHaveBeenCalledWith(payload);
    });
});
