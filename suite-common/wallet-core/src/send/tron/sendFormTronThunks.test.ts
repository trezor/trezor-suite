import { configureMockStore } from '@suite-common/test-utils';
import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
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

const composeContext = (feeEstimationRecipient?: string) =>
    ({ account, network, feeEstimationRecipient }) as any;

const dispatchCompose = (feeEstimationRecipient?: string) =>
    configureMockStore({})
        .dispatch(
            composeTronTransactionFeeLevelsThunk({
                formState,
                composeContext: composeContext(feeEstimationRecipient),
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
        expect(normal).toBeDefined();
        expect(normal?.type).not.toBe('error');
        expect((normal as any)?.accountActivationFee).toBeDefined();
    });

    it('does not add an activation fee when no recipient is available (falls back to own account)', async () => {
        const { normal } = await dispatchCompose(undefined);

        expect(getAccountInfo).not.toHaveBeenCalled();
        expect(normal).toBeDefined();
        expect(normal?.type).not.toBe('error');
        expect((normal as any)?.accountActivationFee).toBeUndefined();
    });
});
