import { configureMockStore } from '@suite-common/test-utils';
import {
    type RbfTransactionParamsEthereum,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import TrezorConnect from '@trezor/connect';

import { composeEthereumCancelTransactionThunk } from '../thunks';

// 1 ETH available so the replacement's fee (with a zero-value output) is always covered.
const ethAccount = mockWalletAccount({
    symbol: 'eth',
    balance: '1000000000000000000',
    availableBalance: '1000000000000000000',
});
const bitcoinAccount = mockWalletAccount({ symbol: 'btc' });

const TXID = '0xstuck';

const ethereumRbfParams: RbfTransactionParamsEthereum = {
    type: 'ethereum',
    txid: TXID,
    outputs: [
        {
            type: 'payment',
            address: '0xRecipient',
            amount: '1000000000000000000',
            formattedAmount: '1',
        },
    ],
    ethereumNonce: 5,
    transactionData: '',
    gasPrice: '',
    maxFeePerGas: '20',
    maxPriorityFeePerGas: '2',
};

const pendingTx = (rbfParams?: RbfTransactionParamsEthereum): WalletAccountTransaction =>
    ({
        txid: TXID,
        blockHeight: 0,
        type: 'sent',
        symbol: 'eth',
        rbfParams,
    }) as unknown as WalletAccountTransaction;

// Raw (wei) fee info; selectConvertedNetworkFeeInfo converts the levels to Gwei before use.
const rawFeeInfo = {
    blockHeight: 100,
    blockTime: 12,
    minFee: 1,
    maxFee: 1000,
    minPriorityFee: 1,
    dustLimit: 0,
    feeLimit: 0,
    levels: [
        {
            label: 'normal',
            feePerUnit: '20000000000',
            maxFeePerGas: '20000000000',
            maxPriorityFeePerGas: '2000000000',
            feeLimit: '21000',
            blocks: 1,
        },
        {
            label: 'high',
            feePerUnit: '30000000000',
            maxFeePerGas: '30000000000',
            maxPriorityFeePerGas: '3000000000',
            feeLimit: '21000',
            blocks: 1,
        },
    ],
};

const createStore = ({
    account = ethAccount,
    transactions = [pendingTx(ethereumRbfParams)],
    withFees = true,
}: {
    account?: typeof ethAccount;
    transactions?: WalletAccountTransaction[];
    withFees?: boolean;
} = {}) =>
    configureMockStore({
        preloadedState: {
            device: { selectedDevice: undefined },
            wallet: {
                accounts: [account],
                transactions: { transactions: { [account.key]: transactions } },
                fees: withFees ? { eth: { status: 'loaded', data: rawFeeInfo } } : {},
                settings: { networkReserve: false },
            },
        },
    });

describe(composeEthereumCancelTransactionThunk.name, () => {
    afterEach(() => jest.restoreAllMocks());

    it('composes a zero-value self-send with a fee bumped above the stuck transaction', async () => {
        jest.spyOn(TrezorConnect, 'blockchainEstimateFee').mockResolvedValue({
            success: true,
            payload: { levels: [{ feeLimit: '21000' }] },
        } as any);

        const store = createStore();

        const response = await store.dispatch(
            composeEthereumCancelTransactionThunk({ accountKey: ethAccount.key, txid: TXID }),
        );

        expect(response.type).toMatch(/fulfilled$/);

        const composed = response.payload as Extract<typeof response.payload, { type: 'final' }>;

        // Self-send with no value and empty calldata.
        expect(composed.type).toBe('final');
        expect(composed.outputs[0].address).toBe(ethAccount.descriptor);
        expect(composed.outputs[0].amount).toBe('0');

        // Fee bumped above the original max fee per gas (20 Gwei) by ETH_SPEED_UP_TX_MULTIPLIER.
        expect(Number(composed.maxFeePerGas)).toBeGreaterThan(20);
    });

    it('rejects when the account is not an Ethereum account', async () => {
        const store = createStore({ account: bitcoinAccount });

        const response = await store.dispatch(
            composeEthereumCancelTransactionThunk({ accountKey: bitcoinAccount.key, txid: TXID }),
        );

        expect(response.type).toMatch(/rejected$/);
        expect(response.payload).toBe('Ethereum account not found.');
    });

    it('rejects when the transaction has no Ethereum RBF params', async () => {
        const store = createStore({ transactions: [pendingTx(undefined)] });

        const response = await store.dispatch(
            composeEthereumCancelTransactionThunk({ accountKey: ethAccount.key, txid: TXID }),
        );

        expect(response.type).toMatch(/rejected$/);
        expect(response.payload).toBe('Transaction cannot be cancelled.');
    });

    it('rejects when the network fee info is unavailable', async () => {
        const store = createStore({ withFees: false });

        const response = await store.dispatch(
            composeEthereumCancelTransactionThunk({ accountKey: ethAccount.key, txid: TXID }),
        );

        expect(response.type).toMatch(/rejected$/);
        expect(response.payload).toBe('Network fees not found.');
    });
});
