import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import {
    type Account,
    type FormState,
    type FormStateTrading,
    type GeneralPrecomposedTransactionFinal,
    type StakeFormState,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import type { TokenInfo } from '@trezor/connect';

import { buildApprovalTransactionData } from './ethUtils';
import {
    constructTransactionReviewOutputs,
    isClearSignedEvmTradingSwapTransaction,
    isClearSignedWrappedNativeTransaction,
} from './reviewTransactionUtils';

const buildPrecomposedTx = (to: string | undefined): GeneralPrecomposedTransactionFinal =>
    ({
        outputs: to ? [{ address: to, amount: '0' }] : [],
    }) as unknown as GeneralPrecomposedTransactionFinal;

// LI.FI Diamond swapTokensMultipleV3ERC20ToERC20 — from the user's screenshot
const LIFI_DIAMOND = '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE';
const LIFI_SWAP_DATA = `0x5fd9ae2e${'00'.repeat(32 * 4)}`;

// ERC-20 transfer (global selector a9059cbb) — works on any contract
const ERC20_TRANSFER_DATA = `0xa9059cbb${'00'.repeat(32 * 2)}`;

// Everstake staking pool
const EVERSTAKE_POOL = '0xD523794C879D9eC028960a231F866758e405bE34';
const STAKE_DATA = `0x3a29dbae${'00'.repeat(32)}`;
const UNSTAKE_DATA = `0x76ec871c${'00'.repeat(32 * 3)}`;
const CLAIM_DATA = '0x33986ffa';

const ERC20_APPROVE_SPENDER = '0x0000000000000000000000000000000000001234';
const ERC20_APPROVE_DATA = buildApprovalTransactionData({
    amount: '1',
    spender: ERC20_APPROVE_SPENDER,
});
const ERC20_REVOKE_DATA = buildApprovalTransactionData({
    amount: '0',
    spender: ERC20_APPROVE_SPENDER,
});

// Canonical WETH (Wrapped Ether) — clear-signed wrap/unwrap (deposit/withdraw) on mainnet
const WETH_MAINNET = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const WETH_DEPOSIT_DATA = '0xd0e30db0'; // deposit() — wrap
const WETH_WITHDRAW_DATA = `0x2e1a7d4d${'00'.repeat(32)}`; // withdraw(uint256) — unwrap
// WBNB on BSC — a wrapped native the firmware does NOT clear-sign
const WBNB_BSC = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';

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

// Clear signing is version-gated per selector: swaps from 2.12.1, WETH wrap/unwrap from 2.12.4.
// Use the highest threshold so every clear-signed flow is covered by one fixture.
const buildUpdatedDevice = () =>
    mockSuiteDevice(undefined, {
        major_version: 2,
        minor_version: 12,
        patch_version: 4,
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

const wethToken: TokenInfo = {
    balance: '1000000',
    contract: WETH_MAINNET.toLowerCase(),
    decimals: 18,
    name: 'Wrapped Ether',
    standard: 'ERC20',
    symbol: 'WETH',
};

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

describe('isClearSignedWrappedNativeTransaction', () => {
    const account = buildEthereumAccount();
    const device = buildUpdatedDevice();

    it.each([
        { op: 'wrap', transactionData: WETH_DEPOSIT_DATA },
        { op: 'unwrap', transactionData: WETH_WITHDRAW_DATA },
    ])('returns true for a canonical WETH $op', ({ transactionData }) => {
        const result = isClearSignedWrappedNativeTransaction({
            account,
            device,
            precomposedTx: buildPrecomposedTransaction({ to: WETH_MAINNET }),
            transactionData,
        });

        expect(result).toBe(true);
    });

    it('returns false for a wrapped native the firmware does not clear-sign (WBNB on BSC)', () => {
        const result = isClearSignedWrappedNativeTransaction({
            account: buildEthereumAccount({ symbol: 'bsc' }),
            device,
            precomposedTx: buildPrecomposedTransaction({ to: WBNB_BSC }),
            transactionData: WETH_DEPOSIT_DATA,
        });

        expect(result).toBe(false);
    });

    it('returns false when the device cannot clear-sign', () => {
        const result = isClearSignedWrappedNativeTransaction({
            account,
            device: mockSuiteDevice(
                { unavailableCapabilities: { evmClearSigning: 'no-support' } },
                { major_version: 2, minor_version: 8, patch_version: 0 },
            ),
            precomposedTx: buildPrecomposedTransaction({ to: WETH_MAINNET }),
            transactionData: WETH_DEPOSIT_DATA,
        });

        expect(result).toBe(false);
    });

    it.each([
        { version: '2.12.1', firmware: { major_version: 2, minor_version: 12, patch_version: 1 } },
        { version: '2.12.3', firmware: { major_version: 2, minor_version: 12, patch_version: 3 } },
    ])(
        'returns false on fw $version, which advertises clear signing but blind-signs WETH',
        ({ firmware }) => {
            const result = isClearSignedWrappedNativeTransaction({
                // No unavailableCapabilities: evmClearSigning is genuinely available from 2.12.1,
                // yet the WETH definition only ships in 2.12.4.
                account,
                device: mockSuiteDevice(undefined, firmware),
                precomposedTx: buildPrecomposedTransaction({ to: WETH_MAINNET }),
                transactionData: WETH_DEPOSIT_DATA,
            });

            expect(result).toBe(false);
        },
    );

    it('returns false for an unrelated contract call to the WETH address', () => {
        const result = isClearSignedWrappedNativeTransaction({
            account,
            device,
            precomposedTx: buildPrecomposedTransaction({ to: WETH_MAINNET }),
            transactionData: ERC20_TRANSFER_DATA,
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

    it('renders the plain flow on modern firmware that predates clear signing', () => {
        const oldFirmwareDevice = mockSuiteDevice(undefined, {
            major_version: 2,
            minor_version: 11,
            patch_version: 0,
        });

        const outputs = constructTransactionReviewOutputs({
            account,
            device: oldFirmwareDevice,
            decreaseOutputId: undefined,
            precomposedForm: buildFormState({
                transactionData: LIFI_SWAP_DATA,
                trading: buildTrading(),
            }),
            precomposedTx: buildPrecomposedTransaction({ to: LIFI_DIAMOND, token: usdcToken }),
        });

        expect(outputs).not.toEqual(
            expect.arrayContaining([expect.objectContaining({ type: 'swap_intent' })]),
        );
    });

    it('omits the receive leg for a partial clear-signed swap (1inch unoswap)', () => {
        const ONEINCH_ROUTER = '0x111111125421cA6dc452d289314280a0f8842A65';
        const UNOSWAP_DATA = `0x83800a8e${'00'.repeat(32 * 4)}`; // unoswap selector

        const outputs = constructTransactionReviewOutputs({
            account,
            device,
            decreaseOutputId: undefined,
            precomposedForm: buildFormState({
                transactionData: UNOSWAP_DATA,
                trading: buildTrading(),
            }),
            precomposedTx: buildPrecomposedTransaction({ to: ONEINCH_ROUTER, token: usdcToken }),
        });

        const tradedAssets = outputs.find(o => o.type === 'traded_assets');
        expect(tradedAssets).toBeDefined();
        expect(tradedAssets?.receive).toBeUndefined();
        expect(tradedAssets?.receiveAddress).toBeUndefined();
        expect(outputs).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ type: 'swap_intent', value: 'swap' }),
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
        { stakeType: 'stake', transactionData: STAKE_DATA },
        { stakeType: 'unstake', transactionData: UNSTAKE_DATA },
        { stakeType: 'claim', transactionData: CLAIM_DATA },
    ])(
        'renders a single address output for a clear-signed $stakeType transaction',
        ({ transactionData }) => {
            const outputs = constructTransactionReviewOutputs({
                account,
                device,
                decreaseOutputId: undefined,
                precomposedForm: buildFormState({ transactionData }),
                precomposedTx: buildPrecomposedTransaction({ to: EVERSTAKE_POOL }),
            });

            // The firmware clear-signs staking as one screen plus the amount/fee summary,
            // so any extra output would desynchronize the review steps from the device.
            expect(outputs).toEqual([{ type: 'address', value: EVERSTAKE_POOL }]);
        },
    );

    it('renders a single address output for the stake form without transaction data', () => {
        const stakeFormState: StakeFormState = {
            ...buildFormState({ transactionData: '' }),
            stakeType: 'stake',
        };

        const outputs = constructTransactionReviewOutputs({
            account,
            device,
            decreaseOutputId: undefined,
            precomposedForm: stakeFormState,
            precomposedTx: buildPrecomposedTransaction({ to: EVERSTAKE_POOL }),
        });

        expect(outputs).toEqual([{ type: 'address', value: EVERSTAKE_POOL }]);
    });

    it('renders the generic contract flow for staking on firmware without clear signing', () => {
        // 2.6.0 is the last version before the updated Ethereum send flow.
        const oldFirmwareDevice = mockSuiteDevice(undefined, {
            major_version: 2,
            minor_version: 6,
            patch_version: 0,
        });

        const outputs = constructTransactionReviewOutputs({
            account,
            device: oldFirmwareDevice,
            decreaseOutputId: undefined,
            precomposedForm: buildFormState({ transactionData: STAKE_DATA }),
            precomposedTx: buildPrecomposedTransaction({ to: EVERSTAKE_POOL }),
        });

        expect(outputs).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ type: 'data', value: STAKE_DATA }),
                expect.objectContaining({ type: 'contract', value: EVERSTAKE_POOL }),
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

    it.each([
        { op: 'wrap', transactionData: WETH_DEPOSIT_DATA },
        { op: 'unwrap', transactionData: WETH_WITHDRAW_DATA },
    ])('mirrors the four device screens for a clear-signed WETH $op', ({ transactionData, op }) => {
        const outputs = constructTransactionReviewOutputs({
            account,
            device,
            decreaseOutputId: undefined,
            precomposedForm: buildFormState({ transactionData }),
            precomposedTx: buildPrecomposedTransaction({
                to: WETH_MAINNET,
                // An unwrap review carries the WETH token; the amount row must still be
                // native, matching the device's AmountFormatter.
                token: op === 'unwrap' ? wethToken : undefined,
            }),
        });

        // `confirm_ethereum_clear_signing` walks provider → intent → amount → summary. The
        // summary is the review's own total row, so three outputs precede it.
        expect(outputs).toEqual([
            { type: 'recipient_name', value: 'WETH' },
            { type: 'contract_intent', value: '' },
            { type: 'amount', value: '1000000' },
        ]);
        // No token on the amount row: wrapping is 1:1 and the device prints ETH both ways.
        expect(outputs[2]).not.toHaveProperty('token');
    });

    it('renders the blind-signing rows for a WETH wrap on firmware without clear signing', () => {
        const outputs = constructTransactionReviewOutputs({
            account,
            device: mockSuiteDevice(
                { unavailableCapabilities: { evmClearSigning: 'update-required' } },
                { major_version: 2, minor_version: 8, patch_version: 0 },
            ),
            decreaseOutputId: undefined,
            precomposedForm: buildFormState({ transactionData: WETH_DEPOSIT_DATA }),
            precomposedTx: buildPrecomposedTransaction({ to: WETH_MAINNET }),
        });

        expect(outputs).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ type: 'data', value: WETH_DEPOSIT_DATA }),
                expect.objectContaining({ type: 'contract', value: WETH_MAINNET }),
            ]),
        );
        expect(outputs).not.toEqual(
            expect.arrayContaining([expect.objectContaining({ type: 'contract_intent' })]),
        );
    });

    it('keeps the raw data row for a wrapped native the firmware does not clear-sign (WBNB on BSC)', () => {
        const outputs = constructTransactionReviewOutputs({
            account: buildEthereumAccount({ symbol: 'bsc' }),
            device,
            decreaseOutputId: undefined,
            precomposedForm: buildFormState({ transactionData: WETH_DEPOSIT_DATA }),
            precomposedTx: buildPrecomposedTransaction({ to: WBNB_BSC }),
        });

        expect(outputs).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ type: 'data', value: WETH_DEPOSIT_DATA }),
            ]),
        );
    });
});
