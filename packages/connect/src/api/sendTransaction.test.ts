import { UI_EVENTS } from '@trezor/connect-common';
import { resolveAfter } from '@trezor/utils/src/resolveAfter';

import { getOrInitFeeLevels } from '../backend/fees';
import type { MethodContext } from '../core/AbstractMethod';
import { getBitcoinNetworkOrThrow } from '../data/coinInfo';
import { createUiPromiseManager } from '../utils/uiPromiseManager';
import { createComposer } from './bitcoin/TransactionComposer';
import SendTransaction from './sendTransaction';

jest.mock('../backend/fees');
jest.mock('@trezor/utils/src/resolveAfter');
jest.mock('./bitcoin/TransactionComposer');

describe('SendTransaction', () => {
    it('does not create a fee promise when the selected account has insufficient funds', async () => {
        const restartError = new Error('Account selection restarted');
        const method = Object.create(SendTransaction.prototype) as SendTransaction;
        const methodInternals = method as unknown as {
            params: {
                coinInfo: ReturnType<typeof getBitcoinNetworkOrThrow>;
                outputs: [];
                sortingStrategy: undefined;
                push: false;
            };
            selectAccount: jest.Mock;
            getBlockchain: jest.Mock;
        };
        methodInternals.params = {
            coinInfo: getBitcoinNetworkOrThrow('btc'),
            outputs: [],
            sortingStrategy: undefined,
            push: false,
        };
        methodInternals.selectAccount = jest
            .fn()
            .mockResolvedValueOnce({ account: { type: 'normal' }, utxo: [] })
            .mockRejectedValueOnce(restartError);
        methodInternals.getBlockchain = jest.fn().mockResolvedValue({});

        jest.mocked(getOrInitFeeLevels).mockReturnValue({
            levels: [],
            load: jest.fn().mockResolvedValue(undefined),
        } as unknown as ReturnType<typeof getOrInitFeeLevels>);
        jest.mocked(createComposer).mockReturnValue(
            jest.fn().mockReturnValue({ type: 'error', error: 'MISSING-UTXOS' }),
        );
        jest.mocked(resolveAfter).mockResolvedValue(undefined);

        const uiPromiseManager = createUiPromiseManager();
        const createUiPromise = jest.fn(uiPromiseManager.create) as jest.MockedFunction<
            MethodContext['createUiPromise']
        >;
        const sendCoreMessage = jest.fn();

        await expect(method.run({ createUiPromise, sendCoreMessage })).rejects.toBe(restartError);

        expect(createUiPromise).not.toHaveBeenCalled();
        expect(sendCoreMessage).toHaveBeenCalledWith(
            expect.objectContaining({ type: UI_EVENTS.ACCOUNT_INSUFFICIENT_FUNDS }),
        );
        expect(methodInternals.selectAccount).toHaveBeenCalledTimes(2);
    });
});
