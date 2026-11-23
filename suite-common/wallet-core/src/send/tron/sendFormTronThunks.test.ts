import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { DEFAULT_PAYMENT } from '@suite-common/wallet-constants';
import {
    type Account,
    AddressDisplayOptions,
    type FormState,
    type PrecomposedTransaction,
    type PrecomposedTransactionError,
} from '@suite-common/wallet-types';
import { mockAccountToken } from '@suite-common/wallet-types/mocks';
import { getDefaultValues } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';

import {
    composeTronTransactionFeeLevelsThunk,
    signTronSendFormTransactionThunk,
} from './sendFormTronThunks';
import { type WalletSettingsRootState } from '../../settings/walletSettingsReducer';

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

const dispatchCompose = (feeEstimationRecipient?: string, assumeNewAccount?: boolean) => {
    const { store } = createTestCompositionRoot<void, unknown>({}).services;

    return store
        .dispatch(
            composeTronTransactionFeeLevelsThunk({
                formState,
                composeContext: composeContext(feeEstimationRecipient, assumeNewAccount),
            }),
        )
        .unwrap();
};

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

describe('composeTronTransactionFeeLevelsThunk – custom fee limit level', () => {
    const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
    const ESTIMATED_FEE = '6428500';
    const ESTIMATED_ENERGY = 64285;

    const tokenAccount: Account = {
        ...account,
        tokens: [
            mockAccountToken({
                contract: USDT_CONTRACT,
                symbol: 'usdt',
                standard: 'TRC20',
                decimals: 6,
                balance: '50',
            }),
        ],
    };

    const buildFormState = (overrides: Partial<FormState> = {}): FormState => ({
        ...getDefaultValues(DEFAULT_PAYMENT.currency, 'tron'),
        outputs: [
            { ...DEFAULT_PAYMENT, address: COLD_RECIPIENT, amount: '1', token: USDT_CONTRACT },
        ],
        ...overrides,
    });

    const dispatchTokenCompose = (tokenFormState: FormState) => {
        const { store } = createTestCompositionRoot<void, unknown>({}).services;

        return store
            .dispatch(
                composeTronTransactionFeeLevelsThunk({
                    formState: tokenFormState,
                    composeContext: { ...composeContext(), account: tokenAccount },
                }),
            )
            .unwrap();
    };

    beforeEach(() => {
        jest.spyOn(TrezorConnect, 'tronComposeTransaction').mockResolvedValue({
            success: true,
            payload: {
                rawDataHex: '',
                ref_block_bytes: '0001',
                ref_block_hash: '0000000000000000',
                expiration: 1,
                timestamp: 0,
                bandwidth: 345,
            },
        });
        jest.spyOn(TrezorConnect, 'blockchainEstimateFee').mockResolvedValue({
            success: true,
            payload: {
                blockTime: 3,
                minFee: 0,
                maxFee: 0,
                minPriorityFee: 0,
                levels: [
                    {
                        label: 'normal',
                        blocks: 1,
                        feePerUnit: '100',
                        feePerTx: ESTIMATED_FEE,
                        feeLimit: '64285',
                    },
                ],
            },
        });
    });

    afterEach(() => jest.restoreAllMocks());

    it('returns only the normal level until the limit is edited', async () => {
        const levels = await dispatchTokenCompose(buildFormState({ selectedFee: 'normal' }));

        expect(levels.custom).toBeUndefined();
        assertComposed(levels.normal);
        expect(levels.normal.fee).toBe(ESTIMATED_FEE);
        expect(levels.normal.feeLimit).toBe(ESTIMATED_FEE);
    });

    it('composes the custom level from the typed limit and keeps the estimate fields', async () => {
        const { normal, custom } = await dispatchTokenCompose(
            buildFormState({ selectedFee: 'custom', feeLimit: '12000000' }),
        );

        assertComposed(normal);
        assertComposed(custom);
        expect(custom.fee).toBe('12000000');
        expect(custom.feeLimit).toBe('12000000');
        expect(custom.estimatedFeeLimit).toBe(ESTIMATED_FEE);
        expect(custom.energyConsumed).toBe(ESTIMATED_ENERGY);
        expect(normal.fee).toBe(ESTIMATED_FEE);
    });

    it('keeps the send-max amount in token units on the custom level', async () => {
        const { normal, custom } = await dispatchTokenCompose(
            buildFormState({ selectedFee: 'custom', feeLimit: '12000000', setMaxOutputId: 0 }),
        );

        assertComposed(normal);
        assertComposed(custom);
        expect(normal.max).toBe('50');
        expect(custom.max).toBe('50');
    });

    it('rejects a limit with memo fee above the available balance and keeps the normal level', async () => {
        const { normal, custom } = await dispatchTokenCompose(
            buildFormState({
                selectedFee: 'custom',
                feeLimit: '999500000',
                destinationTag: 'memo',
            }),
        );

        assertComposed(normal);
        expect(normal.type).toBe('final');
        expect(custom).toMatchObject({ type: 'error', error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' });
    });

    it('falls back to the estimate when the typed limit is empty', async () => {
        const { custom } = await dispatchTokenCompose(
            buildFormState({ selectedFee: 'custom', feeLimit: '' }),
        );

        assertComposed(custom);
        expect(custom.fee).toBe(ESTIMATED_FEE);
    });

    it('mirrors the normal level for a native transfer left on the custom level', async () => {
        const { normal, custom } = await dispatchTokenCompose(
            buildFormState({
                selectedFee: 'custom',
                feeLimit: '12000000',
                outputs: [{ ...DEFAULT_PAYMENT, address: OWNER, amount: '1' }],
            }),
        );

        assertComposed(normal);
        expect(custom).toEqual(normal);
    });
});

describe('signTronSendFormTransactionThunk', () => {
    let signMock: jest.SpyInstance;

    beforeEach(() => {
        jest.spyOn(TrezorConnect, 'blockchainGetInfo').mockResolvedValue({
            success: true,
            payload: { blockHash: '00'.repeat(32), blockHeight: 1 },
        } as any);
        jest.spyOn(TrezorConnect, 'tronComposeTransaction').mockResolvedValue({
            success: true,
            payload: {
                ref_block_bytes: '0001',
                ref_block_hash: '0000000000000000',
                expiration: 1,
                timestamp: 0,
            },
        } as any);
        signMock = jest.spyOn(TrezorConnect, 'tronSignTransaction').mockResolvedValue({
            success: true,
            payload: { signature: 'signature', serializedTx: 'serialized' },
        } as any);
    });

    afterEach(() => jest.restoreAllMocks());

    const sign = (addressDisplayType: AddressDisplayOptions) => {
        const { store } = createTestCompositionRoot<void, WalletSettingsRootState>({
            preloadedState: { wallet: { settings: { addressDisplayType } } },
        }).services;

        return store
            .dispatch(
                signTronSendFormTransactionThunk({
                    formState: { outputs: [{ address: COLD_RECIPIENT, amount: '1' }] } as any,
                    precomposedTransaction: { fee: '0' } as any,
                    selectedAccount: account,
                    device: {} as any,
                }),
            )
            .unwrap();
    };

    it.each([
        [AddressDisplayOptions.CHUNKED, true],
        [AddressDisplayOptions.ORIGINAL, false],
    ])('passes chunkify for address display type %s', async (addressDisplayType, chunkify) => {
        await sign(addressDisplayType);

        expect(signMock).toHaveBeenCalledWith(expect.objectContaining({ chunkify }));
    });
});
