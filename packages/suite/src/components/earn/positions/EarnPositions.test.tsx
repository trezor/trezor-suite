import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { messages } from '@suite/intl';
import { mockNetworksServices } from '@suite-common/networks/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type useYieldOpportunities } from '@suite-common/wallet-core';
import { type DiscoveryStatus } from '@suite-common/wallet-types';

import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { EarnPositions } from './EarnPositions';
import { type MockSuiteState } from '../../../../mocks/mockInitialAppState';
import {
    ETH,
    createEarnStakingTableState,
    ethProduct,
    mockAccount,
    mockStakedPosition,
} from '../dashboard/staking/earnStakingTableTestState';

type YieldOpportunitiesResult = ReturnType<typeof useYieldOpportunities>;

const mockYieldOpportunities = jest.fn<YieldOpportunitiesResult, []>();

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    useYieldOpportunities: () => mockYieldOpportunities(),
}));

jest.mock('@suite-common/earn-staking', () => ({
    ...jest.requireActual('@suite-common/earn-staking'),
    useRefreshStakingProductInfo: () => undefined,
}));

jest.mock('./staking/StakingPositions', () => ({
    StakingPositions: () => <div>staking positions</div>,
}));

jest.mock('./yield/YieldPositions', () => ({
    YieldPositions: () => <div>yield positions</div>,
}));

const ethAccount = mockAccount({ symbol: ETH, descriptor: 'ETH' });

const yieldResult = (overrides: Partial<YieldOpportunitiesResult> = {}) =>
    ({
        yieldOpportunities: [],
        isLoading: false,
        isError: false,
        refetch: jest.fn(),
        ...overrides,
    }) as YieldOpportunitiesResult;

const renderPositions = (hasStakingPosition: boolean, isDiscoveryRunning = false) => {
    const state = createEarnStakingTableState({
        accounts: [ethAccount],
        positions: hasStakingPosition
            ? { [ethAccount.key]: [mockStakedPosition(ethProduct.id, '1000000000000000000')] }
            : {},
    });
    const devicePath = state.device.selectedDevice?.path;
    const preloadedState =
        isDiscoveryRunning && devicePath !== undefined
            ? {
                  ...state,
                  wallet: {
                      ...state.wallet,
                      discovery: { [devicePath]: { status: 'starting' } as DiscoveryStatus },
                  },
              }
            : state;
    const { services } = createTestCompositionRoot<void, MockSuiteState>({ preloadedState });

    renderWithProviders({ ...services, networks: mockNetworksServices() }, <EarnPositions />);
};

const emptyTitle = messages.TR_EARN_NO_POSITIONS.defaultMessage;

describe('EarnPositions', () => {
    it('shows the empty state once a wallet without positions has loaded', () => {
        mockYieldOpportunities.mockReturnValue(yieldResult());

        renderPositions(false);

        expect(screen.getByText(emptyTitle)).toBeInTheDocument();
        expect(
            screen.getByText(messages.TR_EARN_MY_POSITIONS_GO_TO_EARN.defaultMessage),
        ).toBeInTheDocument();
        expect(screen.queryByText('staking positions')).not.toBeInTheDocument();
    });

    it.each([
        ['loading', { isLoading: true }],
        ['failed', { isError: true }],
    ] as const)('keeps the lists while the yield vaults are %s', (_, overrides) => {
        mockYieldOpportunities.mockReturnValue(yieldResult(overrides));

        renderPositions(false);

        expect(screen.queryByText(emptyTitle)).not.toBeInTheDocument();
        expect(screen.getByText('yield positions')).toBeInTheDocument();
    });

    it('waits for the discovery of a newly selected wallet', () => {
        mockYieldOpportunities.mockReturnValue(yieldResult());

        renderPositions(false, true);

        expect(screen.queryByText(emptyTitle)).not.toBeInTheDocument();
    });

    it('lists the positions when the wallet has a staking position', () => {
        mockYieldOpportunities.mockReturnValue(yieldResult());

        renderPositions(true);

        expect(screen.queryByText(emptyTitle)).not.toBeInTheDocument();
        expect(screen.getByText('staking positions')).toBeInTheDocument();
    });
});
