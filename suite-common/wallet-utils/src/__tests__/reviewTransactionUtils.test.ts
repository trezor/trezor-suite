import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import {
    type Account,
    type FormState,
    type FormStateTrading,
    type GeneralPrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import type { TokenInfo } from '@trezor/connect';

import { buildApprovalTransactionData } from '../ethUtils';
import {
    constructTransactionReviewOutputs,
    isClearSignedEvmTradingSwapTransaction,
} from '../reviewTransactionUtils';

const buildPrecomposedTx = (to: string | undefined): GeneralPrecomposedTransactionFinal =>
    ({
        outputs: to ? [{ address: to, amount: '0' }] : [],
    }) as unknown as GeneralPrecomposedTransactionFinal;

// LI.FI Diamond swapTokensMultipleV3ERC20ToERC20 — from the user's screenshot
const LIFI_DIAMOND = '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE';
const LIFI_SWAP_DATA = `0x5fd9ae2e${'00'.repeat(32 * 4)}`;

// ERC-20 transfer (global selector a9059cbb) — works on any contract
const ERC20_TRANSFER_DATA = `0xa9059cbb${'00'.repeat(32 * 2)}`;

const ERC20_APPROVE_SPENDER = '0x0000000000000000000000000000000000001234';
const ERC20_APPROVE_DATA = buildApprovalTransactionData({
    amount: '1',
    spender: ERC20_APPROVE_SPENDER,
});
const ERC20_REVOKE_DATA = buildApprovalTransactionData({
    amount: '0',
    spender: ERC20_APPROVE_SPENDER,
});

const buildTrading = (overrides: Partial<FormStateTrading> = {}): FormStateTrading => ({
    activeSection: 'exchange',
    isSlip24Active: false,
    recipientName: 'LiFi',
    send: {
        cryptoId: undefined,
        accountKey: 'eth-account' as Account['key'],
        symbol: 'eth',
        amount: '1',
    },
    receive: {
        cryptoId: undefined,
        accountKey: 'eth-account' as Account['key'],
        symbol: 'eth',
        amount: '0.97',
    },
    receiveAddress: '0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3',
    ...overrides,
});

const buildFormState = (overrides: Partial<FormState> = {}): FormState => ({
    outputs: [],
    feePerUnit: '1',
    feeLimit: '21000',
    options: [],
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    selectedUtxos: [],
    transactionData: undefined,
    trading: undefined,
    ...overrides,
});

const buildEthereumAccount = (overrides: Partial<Account> = {}): Account =>
    mockWalletAccount({
        symbol: 'eth',
        accountType: 'normal',
        ...overrides,
    });

const buildUpdatedDevice = () =>
    mockSuiteDevice(undefined, {
        major_version: 2,
        minor_version: 6,
        patch_version: 3,
    });

const buildPrecomposedTransaction = ({
    isTokenKnown = true,
    to,
    token,
}: {
    isTokenKnown?: boolean;
    to: string;
    token?: TokenInfo;
}): GeneralPrecomposedTransactionFinal =>
    ({
        outputs: [{ address: to, amount: '1000000' }],
        fee: '21000',
        totalSpent: token ? '1000000' : '1021000',
        feePerByte: '1',
        token,
        useNativeRbf: false,
        isTokenKnown,
    }) as unknown as GeneralPrecomposedTransactionFinal;

const usdcToken: TokenInfo = {
    balance: '1000000',
    contract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    decimals: 6,
    name: 'USD Coin',
    standard: 'ERC20',
    symbol: 'USDC',
};

describe('isClearSignedEvmTradingSwapTransaction', () => {
    const account = buildEthereumAccount();
    const device = buildUpdatedDevice();

    it('returns true for clear-signed exchange swap transaction', () => {
        const result = isClearSignedEvmTradingSwapTransaction({
            account,
            device,
            precomposedTx: buildPrecomposedTx(LIFI_DIAMOND),
            transactionData: LIFI_SWAP_DATA,
            trading: buildTrading(),
        });

        expect(result).toBe(true);
    });

    it('returns false for clear-signed approve in exchange flow', () => {
        const result = isClearSignedEvmTradingSwapTransaction({
            account,
            device,
            precomposedTx: buildPrecomposedTx('0x0000000000000000000000000000000000001234'),
            transactionData: ERC20_APPROVE_DATA,
            trading: buildTrading(),
        });

        expect(result).toBe(false);
    });

    it('returns false outside trading exchange flow', () => {
        const result = isClearSignedEvmTradingSwapTransaction({
            account,
            device,
            precomposedTx: buildPrecomposedTx('0x0000000000000000000000000000000000001234'),
            transactionData: ERC20_TRANSFER_DATA,
            trading: undefined,
        });

        expect(result).toBe(false);
    });

    it('returns false when device does not support clear signing (e.g. Model One)', () => {
        const deviceWithoutClearSigning: TrezorDevice = {
            ...device,
            unavailableCapabilities: { evmClearSigning: 'no-support' },
        } as TrezorDevice;

        const result = isClearSignedEvmTradingSwapTransaction({
            account,
            device: deviceWithoutClearSigning,
            precomposedTx: buildPrecomposedTx(LIFI_DIAMOND),
            transactionData: LIFI_SWAP_DATA,
            trading: buildTrading(),
        });

        expect(result).toBe(false);
    });
});

describe('constructTransactionReviewOutputs', () => {
    const account = buildEthereumAccount();
    const device = buildUpdatedDevice();

    it('renders swap-specific outputs only for clear-signed exchange swap', () => {
        const outputs = constructTransactionReviewOutputs({
            account,
            device,
            decreaseOutputId: undefined,
            precomposedForm: buildFormState({
                transactionData: LIFI_SWAP_DATA,
                trading: buildTrading(),
            }),
            precomposedTx: buildPrecomposedTransaction({ to: LIFI_DIAMOND, token: usdcToken }),
        });

        expect(outputs).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ type: 'recipient_name' }),
                expect.objectContaining({ type: 'swap_intent', value: 'swap' }),
                expect.objectContaining({
                    type: 'traded_assets',
                    receiveAddress: '0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3',
                }),
            ]),
        );
    });

    it('does not render swap-specific outputs for approve transaction in exchange flow', () => {
        const outputs = constructTransactionReviewOutputs({
            account,
            device,
            decreaseOutputId: undefined,
            precomposedForm: buildFormState({
                transactionData: ERC20_APPROVE_DATA,
                trading: buildTrading(),
            }),
            precomposedTx: buildPrecomposedTransaction({
                to: '0x0000000000000000000000000000000000001234',
                token: usdcToken,
            }),
        });

        expect(outputs).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ type: 'contract' }),
                expect.objectContaining({ type: 'approve_data' }),
            ]),
        );
        expect(outputs).not.toEqual(
            expect.arrayContaining([
                expect.objectContaining({ type: 'swap_intent' }),
                expect.objectContaining({ type: 'traded_assets' }),
            ]),
        );
    });

    it.each([
        { transactionData: ERC20_APPROVE_DATA, transactionType: 'approve' },
        { transactionData: ERC20_REVOKE_DATA, transactionType: 'revoke' },
    ])(
        'does not render unknown token contract before supported $transactionType rows',
        ({ transactionData }) => {
            const outputs = constructTransactionReviewOutputs({
                account,
                decreaseOutputId: undefined,
                device,
                precomposedForm: buildFormState({
                    transactionData,
                }),
                precomposedTx: buildPrecomposedTransaction({
                    isTokenKnown: false,
                    to: '0x0000000000000000000000000000000000001234',
                    token: usdcToken,
                }),
                vaultName: 'USDC Vault',
            });

            expect(outputs).toEqual([
                expect.objectContaining({ type: 'address' }),
                expect.objectContaining({ type: 'contract', value: 'USDC Vault' }),
                expect.objectContaining({ type: 'approve_data' }),
            ]);
            expect(outputs).not.toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        type: 'contract',
                        value: usdcToken.contract,
                    }),
                ]),
            );
        },
    );
});
