import { configureMockStore } from '@suite-common/test-utils';
import {
    type FeeInfo,
    type RbfTransactionParamsBitcoin,
    type RbfTransactionParamsEthereum,
    type WalletAccountTransactionWithRequiredRbfParams,
    asAccountDescriptor,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import TrezorConnect from '@trezor/connect';

import { composeEthereumCancelTransactionThunk } from './composeEthereumCancelTransactionThunk';
import { type EthAccount, evmTx } from '../__fixtures__/evmFixtures';

const ONE_ETH = '1000000000000000000';

const account = mockWalletAccount({
    symbol: 'eth',
    balance: ONE_ETH,
    availableBalance: ONE_ETH,
    formattedBalance: '1',
}) as EthAccount;

// Fee levels stored in the reducer are in Wei; selectConvertedNetworkFeeInfo converts them to Gwei.
const rawWeiFeeInfo = (levels: FeeInfo['levels']): FeeInfo => ({
    blockHeight: 100,
    blockTime: 12,
    minFee: 1,
    maxFee: 1000,
    minPriorityFee: 1,
    levels,
});

const eip1559WeiLevels: FeeInfo['levels'] = [
    {
        label: 'normal',
        feePerUnit: '20000000000', // 20 Gwei
        feeLimit: '21000',
        blocks: 1,
        maxFeePerGas: '20000000000', // 20 Gwei
        maxPriorityFeePerGas: '2000000000', // 2 Gwei
    },
    {
        label: 'high',
        feePerUnit: '30000000000', // 30 Gwei
        feeLimit: '21000',
        blocks: 1,
        maxFeePerGas: '30000000000', // 30 Gwei
        maxPriorityFeePerGas: '3000000000', // 3 Gwei
    },
];

const legacyWeiLevels: FeeInfo['levels'] = [
    { label: 'normal', feePerUnit: '20000000000', feeLimit: '21000', blocks: 1 }, // 20 Gwei
];

const ethereumRbfParams = (
    overrides?: Partial<RbfTransactionParamsEthereum>,
): RbfTransactionParamsEthereum => ({
    type: 'ethereum',
    txid: '0x6',
    outputs: [{ type: 'payment', address: '0xrecipient', amount: '1', formattedAmount: '1' }],
    ethereumNonce: 6,
    transactionData: '',
    gasPrice: '',
    maxFeePerGas: '25', // Gwei
    maxPriorityFeePerGas: '2.5', // Gwei
    ...overrides,
});

const cancellableTx = (
    rbfParams: RbfTransactionParamsEthereum,
): WalletAccountTransactionWithRequiredRbfParams =>
    ({
        ...evmTx(rbfParams.ethereumNonce, { confirmed: false }),
        rbfParams,
    }) as WalletAccountTransactionWithRequiredRbfParams;

const initStore = (levels?: FeeInfo['levels']) =>
    configureMockStore({
        extra: undefined,
        preloadedState: {
            device: { selectedDevice: undefined },
            wallet: {
                settings: { networkReserve: false },
                transactions: { transactions: {} },
                fees:
                    levels === undefined
                        ? {}
                        : { eth: { status: 'loaded', data: rawWeiFeeInfo(levels) } },
            },
        },
    });

const compose = (
    store: ReturnType<typeof initStore>,
    tx: WalletAccountTransactionWithRequiredRbfParams,
    composeAccount: EthAccount = account,
) =>
    store.dispatch(composeEthereumCancelTransactionThunk({ account: composeAccount, tx })).unwrap();

describe(composeEthereumCancelTransactionThunk.name, () => {
    beforeEach(() => {
        jest.spyOn(TrezorConnect, 'blockchainEstimateFee').mockResolvedValue({
            success: true,
            payload: { blockTime: 12, minFee: 1, maxFee: 1000, levels: [{ feeLimit: '21000' }] },
        } as any);
    });

    afterEach(() => jest.restoreAllMocks());

    it('composes an EIP-1559 cancel tx: 0-value self-transfer with bumped gas params', async () => {
        const tx = cancellableTx(ethereumRbfParams());

        const { composedCancelTx, cancelFormState } = await compose(
            initStore(eip1559WeiLevels),
            tx,
        );

        expect(composedCancelTx.type).toBe('final');
        expect(composedCancelTx.rbfType).toBe('cancel');
        expect(composedCancelTx.prevTxid).toBe('0x6');
        // max(original 25, high 30) * ETH_SPEED_UP_TX_MULTIPLIER (1.2)
        expect(composedCancelTx.maxFeePerGas).toBe('36');
        // max(original 2.5, high 3) * 1.2
        expect(composedCancelTx.maxPriorityFeePerGas).toBe('3.6');

        expect(cancelFormState.outputs).toEqual([
            expect.objectContaining({
                type: 'payment',
                address: account.descriptor,
                amount: '0',
                token: null,
            }),
        ]);
        expect(cancelFormState.rbfParams).toBe(tx.rbfParams);
        expect(cancelFormState.options).toEqual(['broadcast']);
        expect(cancelFormState.selectedFee).toBe('normal');
    });

    it('composes a legacy cancel tx: fee bumped above the original gas price', async () => {
        const tx = cancellableTx(ethereumRbfParams({ gasPrice: '25', maxFeePerGas: '' }));

        const { composedCancelTx } = await compose(initStore(legacyWeiLevels), tx);

        expect(composedCancelTx.type).toBe('final');
        // max(network 20, original 25 + minFee 1)
        expect(composedCancelTx.feePerByte).toBe('26');
    });

    it('rejects when fee info is not available', async () => {
        const tx = cancellableTx(ethereumRbfParams());

        await expect(compose(initStore(undefined), tx)).rejects.toMatchObject({
            error: 'fee-levels-compose-failed',
            message: expect.stringMatching(/fee info/i),
        });
    });

    it('rejects when the composed level is not final', async () => {
        const emptyAccount = mockWalletAccount({
            symbol: 'eth',
            balance: '0',
            availableBalance: '0',
            formattedBalance: '0',
            descriptor: asAccountDescriptor('0xEmptyAccount'),
        }) as EthAccount;
        const tx = cancellableTx(ethereumRbfParams());

        await expect(compose(initStore(eip1559WeiLevels), tx, emptyAccount)).rejects.toMatchObject({
            error: 'fee-levels-compose-failed',
            message: expect.stringMatching(/cancellation fee level/i),
        });
    });

    it('rejects non-ethereum rbf params even when fee info is available', async () => {
        // Defensive guard: callers only ever pass ethereum rbf params, but the thunk must reject
        // (not throw or mis-compose) if a bitcoin tx ever reaches it.
        const bitcoinRbfParams: RbfTransactionParamsBitcoin = {
            type: 'bitcoin',
            txid: '0x6',
            utxo: [],
            outputs: [],
            feeRate: '1',
            baseFee: 0,
        };
        const tx = {
            ...evmTx(6, { confirmed: false }),
            rbfParams: bitcoinRbfParams,
        } as WalletAccountTransactionWithRequiredRbfParams;

        await expect(compose(initStore(eip1559WeiLevels), tx)).rejects.toMatchObject({
            error: 'fee-levels-compose-failed',
            message: expect.stringMatching(/invalid RBF params/i),
        });
    });

    it('cancels a pending ERC-20 transfer with a native 0-value self-transfer (not a token transfer)', async () => {
        // The original was a token send, but a cancel is always a 0-value NATIVE self-transfer;
        // the token from the original outputs must never leak into the replacement.
        const tx = cancellableTx(
            ethereumRbfParams({
                outputs: [
                    {
                        type: 'payment',
                        address: '0xrecipient',
                        amount: '100',
                        formattedAmount: '100',
                        token: '0xTokenContractAddress',
                    },
                ],
            }),
        );

        const { cancelFormState } = await compose(initStore(eip1559WeiLevels), tx);

        expect(cancelFormState.outputs).toEqual([
            expect.objectContaining({
                type: 'payment',
                address: account.descriptor,
                amount: '0',
                token: null,
            }),
        ]);
    });
});
