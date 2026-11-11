import '@suite-common/test-utils/globalOverrides';

import { render, screen } from '@testing-library/react';

import {
    type GetNetworkDeps,
    type NetworksDep,
    createGetNetwork,
    createNetworkFamiliesCompositionRoot,
} from '@suite-common/networks';
import { mockNetworksServices } from '@suite-common/networks/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { asGetter, createMockDeps } from '@trezor/dependency-injection';
import type {
    BackendType,
    NetworkSuiteCommonModuleApi,
    TransactionFact,
} from '@trezor/network-module-suite-common-types';
import { type WithServices } from '@trezor/redux-utils';

import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { EthereumTransactionFacts } from './EthereumTransactionFacts';
import { TransactionFacts } from './TransactionFacts';
import { type DefaultTransactionFactsProps } from './transactionFactsTypes';
import {
    type MockSuiteState,
    mockInitialAppState,
} from '../../../../../../../../mocks/mockInitialAppState';

const createTransaction = (overrides: Partial<WalletAccountTransaction>) =>
    ({
        type: 'sent',
        txid: 'txid',
        amount: '1000',
        fee: '2250',
        targets: [],
        tokens: [],
        internalTransfers: [],
        details: { vin: [], vout: [], size: 225, totalInput: '0', totalOutput: '0' },
        ...overrides,
    }) as WalletAccountTransaction;

const ethereumTransaction = createTransaction({
    symbol: asNetworkSymbol('eth'),
    ethereumSpecific: {
        status: 1,
        nonce: 7,
        gasLimit: 21000,
        gasUsed: 21000,
        gasPrice: '30000000000',
        effectiveGasPrice: '25000000000',
        maxFeePerGas: '40000000000',
        maxPriorityFeePerGas: '2000000000',
        baseFeePerGas: '23000000000',
    },
});

const renderFacts = (transaction: WalletAccountTransaction, backend: BackendType) => {
    const getNetwork = createGetNetwork({
        networkFamilies: createNetworkFamiliesCompositionRoot(
            createMockDeps<NetworkSuiteCommonModuleApi>({ getTrezorConnect: null }),
        ),
        getNetworkBackend: asGetter(() => backend),
    } satisfies GetNetworkDeps);
    const { services } = createTestCompositionRoot<WithServices<NetworksDep>, MockSuiteState>({
        preloadedState: mockInitialAppState,
        services: () => ({ networks: mockNetworksServices({ getNetwork }) }),
    });

    renderWithProviders(
        services,
        <TransactionFacts tx={transaction} isConfirmed context={{ nonceStatus: 'ok' }} />,
    );
};

describe(TransactionFacts.name, () => {
    it('shows the EIP-1559 fee market of a transaction Blockbook served', () => {
        renderFacts(ethereumTransaction, 'blockbook');

        expect(screen.getByText('Nonce')).toBeTruthy();
        expect(screen.getByText('Max fee per gas')).toBeTruthy();
        expect(screen.getByText('Block base fee')).toBeTruthy();
    });

    it('shows only gas and the price charged for a transaction a custom RPC served', () => {
        renderFacts(ethereumTransaction, 'evm-rpc');

        expect(screen.getByText('Gas price')).toBeTruthy();
        expect(screen.queryByText('Max fee per gas')).toBeNull();
    });

    it('shows the fee rate computed for an Electrum transaction', () => {
        renderFacts(createTransaction({ symbol: asNetworkSymbol('btc') }), 'electrum');

        expect(screen.getByText('Fee rate')).toBeTruthy();
        expect(screen.getByText('10.00')).toBeTruthy();
    });
});

describe(EthereumTransactionFacts.name, () => {
    const nonce: TransactionFact = {
        id: 'nonce',
        label: { id: 'TR_NONCE', defaultMessage: 'Nonce' },
        icon: 'sequence',
        value: { kind: 'count', value: 7 },
    };

    const getNonceDecoration = (nonceStatus: 'ok' | 'gap' | 'superseded') => {
        let decoration: unknown;
        const DefaultFacts = ({ decorate }: DefaultTransactionFactsProps) => {
            decoration = decorate?.(nonce);

            return null;
        };

        render(
            <EthereumTransactionFacts
                facts={[nonce]}
                context={{ nonceStatus, nextNonce: 8 }}
                DefaultFacts={DefaultFacts}
            />,
        );

        return decoration;
    };

    it('warns on a stuck nonce through the default list', () => {
        expect(getNonceDecoration('gap')).toBeTruthy();
        expect(getNonceDecoration('superseded')).toBeTruthy();
    });

    it('leaves a nonce that is not stuck as the network stated it', () => {
        expect(getNonceDecoration('ok')).toBeFalsy();
    });
});
