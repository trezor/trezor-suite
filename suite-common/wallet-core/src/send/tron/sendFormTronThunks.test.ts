import { configureMockStore } from '@suite-common/test-utils';
import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import {
    type Account,
    type PrecomposedTransaction,
    type PrecomposedTransactionError,
} from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';

import { composeTronTransactionFeeLevelsThunk } from './sendFormTronThunks';

const OWNER = 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9';
const COLD_RECIPIENT = 'TVDGpn4hCSzJ5nkHPLetk8KQBtwaTppnkr';
const trxSymbol = asNetworkSymbol('trx');

const network = getNetwork(trxSymbol);

const account = {
    symbol: trxSymbol,
    networkType: 'tron',
    accountType: 'normal',
    index: 0,
    deviceState: 'mock-device-state',
    descriptor: OWNER,
    key: 'trx-account-key',
    path: "m/44'/195'/0'/0/0",
    availableBalance: '1000000000',
    tokens: [],
    misc: {
        tronResources: { availableStakedBandwidth: 0, availableFreeBandwidth: 5000 },
    },
} as unknown as Account;

const formState = { outputs: [{ address: '', amount: '1' }] } as any;

const composeContext = (feeEstimationRecipient?: string, assumeNewAccount?: boolean) =>
    ({ account, network, feeEstimationRecipient, assumeNewAccount }) as any;

function assertComposed(
    tx: PrecomposedTransaction | undefined,
): asserts tx is Exclude<PrecomposedTransaction, PrecomposedTransactionError> {
    if (!tx || tx.type === 'error') {
        throw new Error(`Expected a composed transaction, got ${tx?.error ?? 'undefined'}`);
    }
}

const dispatchCompose = (feeEstimationRecipient?: string, assumeNewAccount?: boolean) =>
    configureMockStore({})
        .dispatch(
            composeTronTransactionFeeLevelsThunk({
                formState,
                composeContext: composeContext(feeEstimationRecipient, assumeNewAccount),
            }),
        )
        .unwrap();

describe('composeTronTransactionFeeLevelsThunk – cold recipient activation fee', () => {
    let getAccountInfo: jest.SpyInstance;

    beforeEach(() => {
        jest.spyOn(TrezorConnect, 'tronComposeTransaction').mockResolvedValue({
            success: true,
            payload: { bandwidth: 300 },
        } as any);
        getAccountInfo = jest.spyOn(TrezorConnect, 'getAccountInfo').mockResolvedValue({
            success: true,
            payload: { descriptor: COLD_RECIPIENT, empty: true },
        } as any);
    });

    afterEach(() => jest.restoreAllMocks());

    it('estimates against the fee-estimation recipient and includes the activation fee', async () => {
        const { normal } = await dispatchCompose(COLD_RECIPIENT);

        expect(getAccountInfo).toHaveBeenCalledWith(
            expect.objectContaining({ descriptor: COLD_RECIPIENT }),
        );
        assertComposed(normal);
        expect(normal.accountActivationFee).toBe('1000000');
        // 0.1 TRX create-account fee + 1 TRX activation fee
        expect(normal.fee).toBe('1100000');
    });

    it('does not add an activation fee when no recipient is available (falls back to own account)', async () => {
        const { normal } = await dispatchCompose(undefined);

        expect(getAccountInfo).not.toHaveBeenCalled();
        assertComposed(normal);
        expect(normal.accountActivationFee).toBeUndefined();
        expect(normal.fee).toBe('0');
    });

    it('assumeNewAccount charges the activation fee without asking the backend', async () => {
        const { normal } = await dispatchCompose(undefined, true);

        expect(getAccountInfo).not.toHaveBeenCalled();
        assertComposed(normal);
        expect(normal.accountActivationFee).toBe('1000000');
        expect(normal.fee).toBe('1100000');
    });
});
