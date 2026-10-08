import type {
    ChainSendAccount,
    ChainSendDraft,
    ComposeFeeLevelsParams,
} from '@trezor/network-module-suite-common-types';
import { asNetworkSymbol } from '@trezor/network-module-types';

import type { EvmJsonRpcClient } from './EvmJsonRpcClient';
import type { RuntimeEvmNetworkDefinition } from './RuntimeEvmNetworkDefinition';
import { createEvmJsonRpcChainNetwork } from './createEvmJsonRpcChainNetwork';

const GWEI = 1_000_000_000n;

const client = {
    getChainId: jest.fn<Promise<number>, []>(),
    getBlockNumber: jest.fn<Promise<bigint>, []>(),
    getBalance: jest.fn<Promise<bigint>, [string]>(),
    getTransactionCount: jest.fn<Promise<number>, [string, 'latest' | 'pending']>(),
    estimateGas: jest.fn(),
    estimateFeesPerGas: jest.fn(),
    sendRawTransaction: jest.fn<Promise<string>, [string]>(),
} satisfies EvmJsonRpcClient;

const connect = { ethereumSignTransaction: jest.fn() };
const createRpcClient = jest.fn(() => client);

const definition: RuntimeEvmNetworkDefinition = {
    symbol: asNetworkSymbol('ink'),
    chainId: 57073,
    name: 'Ink',
    nativeSymbol: 'ETH',
    decimals: 18,
    rpcUrls: ['https://rpc.example'],
    source: 'user',
};

const network = createEvmJsonRpcChainNetwork({
    getTrezorConnect: () => connect,
    createRpcClient,
    onEvmFeeEstimationFailed: jest.fn(),
})(definition);

const account: ChainSendAccount = {
    symbol: definition.symbol,
    descriptor: '0x' + '1'.repeat(40),
    index: 0,
    path: "m/44'/60'/0'/0/0",
    accountType: 'normal',
    deviceState: 'wallet-identity',
    balance: '1000000000000000000',
    availableBalance: '1000000000000000000',
    formattedBalance: '1',
};

const draft = (amount = '0.1') =>
    ({
        outputs: [
            {
                type: 'payment',
                address: '0x' + '2'.repeat(40),
                amount,
                fiat: '',
                currency: { value: 'usd', label: 'USD' },
                token: null,
            },
        ],
        selectedFee: 'normal',
        feePerUnit: '',
        feeLimit: '',
        options: ['broadcast'],
        isCoinControlEnabled: false,
        selectedUtxos: [],
    }) as unknown as ChainSendDraft;

const { signal } = new AbortController();

describe('createEvmJsonRpcChainNetwork', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        client.getChainId.mockResolvedValue(57073);
        client.getBlockNumber.mockResolvedValue(100n);
        client.estimateFeesPerGas.mockResolvedValue({
            maxFeePerGas: 2n * GWEI,
            maxPriorityFeePerGas: GWEI,
        });
        client.estimateGas.mockResolvedValue(21000n);
    });

    it('opens one client over the definition’s nodes and reads the balance in coins', async () => {
        client.getBalance.mockResolvedValue(1500000000000000000n);

        await expect(
            network.getAccountBalance({
                ref: {
                    symbol: definition.symbol,
                    descriptor: account.descriptor,
                    accountType: 'normal',
                },
                signal,
            }),
        ).resolves.toEqual({
            balance: '1.5',
            availableBalance: '1.5',
            displayBalance: '1.5',
            empty: false,
        });
        expect(client.getBalance).toHaveBeenCalledWith(account.descriptor);
        expect(network).toMatchObject({
            backendType: 'evm-rpc',
            nativeAsset: { symbol: 'ETH', name: 'Ink' },
        });
    });

    it('has no rates', async () => {
        await expect(network.getNativeFiatRate({ currency: 'usd', signal })).resolves.toBeNull();
    });

    it('quotes normal and high fees in gwei from the node', async () => {
        const feeInfo = await network.send!.getFeeInfo!({});

        expect(feeInfo.levels).toEqual([
            expect.objectContaining({
                label: 'high',
                maxFeePerGas: '3',
                maxPriorityFeePerGas: '2',
            }),
            expect.objectContaining({
                label: 'normal',
                maxFeePerGas: '2',
                maxPriorityFeePerGas: '1',
            }),
        ]);
        expect(feeInfo.blockHeight).toBe(100);
    });

    it('composes with the gas the node estimates', async () => {
        const feeInfo = await network.send!.getFeeInfo!({});
        const context: ComposeFeeLevelsParams['context'] = { feeInfo };

        const levels = await network.send!.composeFeeLevels({ account, draft: draft(), context });

        expect(client.estimateGas).toHaveBeenCalledWith(
            expect.objectContaining({ from: account.descriptor, to: '0x' + '2'.repeat(40) }),
        );
        expect(levels.normal).toMatchObject({ type: 'final', feeLimit: '21000' });
    });

    it('refuses to compose or broadcast when the node serves another chain', async () => {
        client.getChainId.mockResolvedValue(1);
        const feeInfo = {
            blockHeight: 1,
            blockTime: 12,
            minFee: 0,
            maxFee: 1,
            minPriorityFee: 0,
            levels: [],
        };

        await expect(
            network.send!.composeFeeLevels({ account, draft: draft(), context: { feeInfo } }),
        ).rejects.toMatchObject({ code: 'compose-failed', notify: 'message' });
        await expect(
            network.send!.push({
                account,
                serializedTx: '0xsigned',
                isMevProtectionEnabled: false,
            }),
        ).rejects.toMatchObject({ code: 'push-failed' });
        expect(client.sendRawTransaction).not.toHaveBeenCalled();
    });

    it('signs for the definition’s chain at the node’s pending nonce, through Connect only', async () => {
        client.getTransactionCount.mockImplementation((_address, blockTag) =>
            Promise.resolve(blockTag === 'pending' ? 7 : 6),
        );
        connect.ethereumSignTransaction.mockResolvedValue({
            success: true,
            payload: { serializedTx: '0xsigned' },
        });
        const feeInfo = await network.send!.getFeeInfo!({});
        const levels = await network.send!.composeFeeLevels({
            account,
            draft: draft(),
            context: { feeInfo },
        });

        const signed = await network.send!.sign({
            account,
            draft: draft(),
            precomposed: levels.normal as never,
            options: { device: { path: 'device' } as never },
        });

        expect(signed).toMatchObject({ serializedTx: '0xsigned', nonce: '7' });
        expect(connect.ethereumSignTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                path: account.path,
                transaction: expect.objectContaining({ chainId: 57073, nonce: '0x7' }),
            }),
        );
    });

    it('broadcasts over the node and returns its transaction hash', async () => {
        client.sendRawTransaction.mockResolvedValue('0xhash');

        await expect(
            network.send!.push({ account, serializedTx: '0xsigned', isMevProtectionEnabled: true }),
        ).resolves.toEqual({ txid: '0xhash' });
        expect(client.sendRawTransaction).toHaveBeenCalledWith('0xsigned');
    });
});
