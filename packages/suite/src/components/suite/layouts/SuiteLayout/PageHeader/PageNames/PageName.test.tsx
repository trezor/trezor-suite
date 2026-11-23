import '@suite-common/test-utils/globalOverrides';

import { type ReactNode } from 'react';

import { screen } from '@testing-library/react';

import { type SuiteRouterHistoryDep } from '@suite/router';
import { createRouterStateMockForRoute, mockSuiteRouterHistory } from '@suite/router/mocks';
import { ExperimentId, messageSystemInitialState } from '@suite-common/message-system';
import { mockNetworkIcon, mockNetworksState } from '@suite-common/networks/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { PageName } from './PageName';
import {
    type MockSuiteState,
    mockInitialAppState,
} from '../../../../../../../mocks/mockInitialAppState';

jest.mock('@suite/labeling', () => ({
    Labeling: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

const ETH = asNetworkSymbol('eth');
const BTC = asNetworkSymbol('btc');

const ethAccount = mockWalletAccount({
    symbol: ETH,
    descriptor: asAccountDescriptor('0x73d0385F4d8E00C5e6504C6030F47BF6212736A8'),
});

const btcAccount = mockWalletAccount({
    symbol: BTC,
    descriptor: asAccountDescriptor('zpubTestDescriptor'),
});

const ASSET_FIRST_HOME = {
    ...messageSystemInitialState,
    config: {
        version: 1,
        timestamp: '2026-01-01T00:00:00Z',
        sequence: 1,
        actions: [],
        experiments: [
            {
                conditions: [],
                experiment: {
                    id: ExperimentId.assetFirstHomeTable,
                    groups: [{ variant: 'B', percentage: 100 }],
                },
            },
        ],
    },
    validExperiments: [ExperimentId.assetFirstHomeTable],
} as MockSuiteState['messageSystem'];

type RenderPageNameParams = {
    routeName: 'wallet-index' | 'wallet-details';
    isAssetFirstHome: boolean;
    account?: Account;
};

const renderPageName = ({
    routeName,
    isAssetFirstHome,
    account = ethAccount,
}: RenderPageNameParams) => {
    const { services } = createTestCompositionRoot<
        { services: SuiteRouterHistoryDep },
        MockSuiteState
    >({
        preloadedState: {
            ...mockInitialAppState,
            analytics: { ...mockInitialAppState.analytics, instanceId: 'test-instance-id' },
            messageSystem: isAssetFirstHome ? ASSET_FIRST_HOME : messageSystemInitialState,
            networks: mockNetworksState([account.symbol]),
            metadata: {
                ...mockInitialAppState.metadata,
                providers: [],
                selectedProvider: { labels: '', passwords: '' },
            },
            router: createRouterStateMockForRoute(routeName),
            wallet: {
                ...mockInitialAppState.wallet,
                accounts: [account],
                selectedAccount: {
                    status: 'loaded',
                    account,
                } as MockSuiteState['wallet']['selectedAccount'],
            },
        },
        services: () => ({ suiteRouterHistory: mockSuiteRouterHistory() }),
    });

    renderWithProviders(
        { ...services, networks: { networkIcon: mockNetworkIcon() } },
        <PageName />,
    );
};

describe('the address in the header of an account page', () => {
    it('is shown shortened on the overview with the asset-first Home', () => {
        renderPageName({ routeName: 'wallet-index', isAssetFirstHome: true });

        expect(screen.getByTestId('@wallet/account/address')).toHaveTextContent(
            '0x73d0...212736A8',
        );
    });

    it('is left out for a UTXO account, which is not one address', () => {
        renderPageName({ routeName: 'wallet-index', isAssetFirstHome: true, account: btcAccount });

        expect(screen.queryByTestId('@wallet/account/address')).not.toBeInTheDocument();
    });

    it('is left out on the other tabs of the account', () => {
        renderPageName({ routeName: 'wallet-details', isAssetFirstHome: true });

        expect(screen.queryByTestId('@wallet/account/address')).not.toBeInTheDocument();
    });

    it('is left out on the overview while the classic Home is shown', () => {
        renderPageName({ routeName: 'wallet-index', isAssetFirstHome: false });

        expect(screen.queryByTestId('@wallet/account/address')).not.toBeInTheDocument();
    });
});
