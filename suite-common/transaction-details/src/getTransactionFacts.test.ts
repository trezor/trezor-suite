import {
    type GetNetworkDeps,
    createGetNetwork,
    createNetworkFamiliesCompositionRoot,
} from '@suite-common/networks';
import type { Transaction } from '@trezor/blockchain-link-types';
import { asGetter, createMockDeps } from '@trezor/dependency-injection';
import type {
    BackendType,
    NetworkSuiteCommonModuleApi,
} from '@trezor/network-module-suite-common-types';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { getTransactionFacts } from './getTransactionFacts';

const createTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
    type: 'sent',
    txid: 'txid',
    amount: '1000',
    fee: '2250',
    targets: [],
    tokens: [],
    internalTransfers: [],
    details: { vin: [], vout: [], size: 225, totalInput: '0', totalOutput: '0' },
    ...overrides,
});

const ethereumSpecific: Transaction['ethereumSpecific'] = {
    status: 1,
    nonce: 7,
    gasLimit: 21000,
    gasUsed: 21000,
    gasPrice: '30000000000',
    effectiveGasPrice: '25000000000',
    maxFeePerGas: '40000000000',
    maxPriorityFeePerGas: '2000000000',
    baseFeePerGas: '23000000000',
};

const getFacts = (
    symbol: string,
    backend: BackendType,
    transaction: Transaction,
    isConfirmed = true,
) => {
    const getNetwork = createGetNetwork({
        networkFamilies: createNetworkFamiliesCompositionRoot(
            createMockDeps<NetworkSuiteCommonModuleApi>({ getTrezorConnect: null }),
        ),
        getNetworkBackend: asGetter(() => backend),
    } satisfies GetNetworkDeps);

    return getTransactionFacts({
        network: getNetwork({ symbol: asNetworkSymbol(symbol) }),
        transaction,
        isConfirmed,
    });
};

const getFactIds = (...params: Parameters<typeof getFacts>) =>
    getFacts(...params)?.facts.map(fact => fact.id);

describe(getTransactionFacts.name, () => {
    describe('EVM', () => {
        it('explains the fee market of a transaction Blockbook served', () => {
            const result = getFacts('eth', 'blockbook', createTransaction({ ethereumSpecific }));

            expect(result?.family).toBe('ethereum');
            expect(result?.facts.map(fact => fact.id)).toEqual([
                'nonce',
                'gas',
                'gasPrice',
                'maxFeePerGas',
                'baseFeePerGas',
                'maxPriorityFeePerGas',
            ]);
            expect(result?.facts.find(fact => fact.id === 'gasPrice')?.value).toEqual({
                kind: 'feeRate',
                rate: '25',
                unit: 'Gwei',
            });
        });

        it('reports only gas and the price charged for a transaction a custom RPC served', () => {
            expect(getFactIds('eth', 'evm-rpc', createTransaction({ ethereumSpecific }))).toEqual([
                'nonce',
                'gas',
                'gasPrice',
            ]);
        });

        it('waits for the block before stating the price of a pending EIP-1559 transaction', () => {
            const facts = getFacts(
                'eth',
                'blockbook',
                createTransaction({ ethereumSpecific }),
                false,
            )?.facts;

            expect(facts?.find(fact => fact.id === 'gasPrice')?.value.kind).toBe(
                'pendingUntilConfirmed',
            );
            expect(facts?.find(fact => fact.id === 'baseFeePerGas')?.value.kind).toBe(
                'pendingUntilConfirmed',
            );
        });

        it('shows only the gas limit until the gas is used', () => {
            const gas = getFacts(
                'eth',
                'evm-rpc',
                createTransaction({ ethereumSpecific: { ...ethereumSpecific, gasUsed: 0 } }),
            )?.facts.find(fact => fact.id === 'gas');

            expect(gas?.label.id).toBe('TR_GAS_LIMIT');
            expect(gas?.value).toEqual({ kind: 'usage', limit: 21000, used: undefined });
        });
    });

    describe('Bitcoin', () => {
        it('uses the fee rate Blockbook reports', () => {
            expect(
                getFacts('btc', 'blockbook', createTransaction({ feeRate: '12.5' }))?.facts,
            ).toEqual([
                expect.objectContaining({ value: expect.objectContaining({ rate: '12.50' }) }),
            ]);
        });

        it('computes the fee rate for Electrum, which reports none', () => {
            expect(getFacts('btc', 'electrum', createTransaction())?.facts[0]?.value).toEqual({
                kind: 'feeRate',
                rate: '10.00',
                unit: 'sat/vB',
            });
        });
    });

    it('shows a missing Ripple destination tag', () => {
        expect(
            getFacts('xrp', 'ripple', createTransaction({ rippleSpecific: {} }))?.facts[0]?.value,
        ).toEqual({ kind: 'text', text: '-' });
    });

    it('marks a Stellar memo as written by someone else', () => {
        const transaction = createTransaction({
            stellarSpecific: { memo: 'see https://example.com', feeSource: 'source' },
        });

        expect(getFacts('xlm', 'stellar', transaction)?.facts[0]?.value).toEqual({
            kind: 'text',
            text: 'see https://example.com',
            isUserProvided: true,
        });
    });

    it('lists only the Tron resources the transaction used', () => {
        const transaction = createTransaction({ tronSpecific: { energyUsage: '345' } });

        expect(getFactIds('trx', 'blockbook', transaction)).toEqual(['energy']);
    });

    it('has nothing to say about a transaction without network-specific data', () => {
        expect(getFacts('sol', 'solana', createTransaction())?.facts).toEqual([]);
    });

    it('has no transaction details for a family without them', () => {
        expect(getFacts('ada', 'blockfrost', createTransaction())).toBeUndefined();
    });
});
