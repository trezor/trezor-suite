import '@suite-common/test-utils/globalOverrides';

import { type Reducer } from '@reduxjs/toolkit';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { initialMetadataState } from '@suite/metadata';
import { type GotoThunkDeps, routerReducer } from '@suite/router';
import { mockSuiteRouterHistory } from '@suite/router/mocks';
import { mockNetworksServices } from '@suite-common/networks/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { toTokenAddress, toTokenSymbol } from '@suite-common/tokens';
import { type YieldListItem } from '@suite-common/wallet-core';

import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { YieldPositionCard } from './YieldPositionCard';
import { type MockSuiteState } from '../../../../../mocks/mockInitialAppState';
import {
    ETH,
    createEarnStakingTableState,
    mockAccount,
} from '../../dashboard/staking/earnStakingTableTestState';

const UNDERLYING_TOKEN_CONTRACT = toTokenAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');
const RECEIPT_TOKEN_CONTRACT = toTokenAddress('0x58D97B57BB95320F9a05DC918Aef65434969c2B2');

const ethAccount = mockAccount({ symbol: ETH, descriptor: 'ETH' });

const position: YieldListItem = {
    id: `vault-usdc-${ethAccount.key}`,
    yieldId: 'vault-usdc',
    vaultName: 'Vault USDC',
    tokenSymbol: toTokenSymbol('USDC'),
    networkSymbol: ETH,
    underlyingTokenContract: UNDERLYING_TOKEN_CONTRACT,
    receiptTokenContract: RECEIPT_TOKEN_CONTRACT,
    contractAddress: RECEIPT_TOKEN_CONTRACT,
    tokenContractAddress: UNDERLYING_TOKEN_CONTRACT,
    apy: 4.2,
    accountKey: ethAccount.key,
    tokenBalance: '100',
};

const renderCard = () => {
    const initialState: MockSuiteState = {
        ...createEarnStakingTableState({ accounts: [ethAccount] }),
        metadata: initialMetadataState,
    };
    const reducer: Reducer<MockSuiteState> = (state = initialState, action) => ({
        ...state,
        router: routerReducer(state.router, action),
    });
    const { services } = createTestCompositionRoot<GotoThunkDeps, MockSuiteState>({
        preloadedState: initialState,
        reducer,
        services: () => ({ suiteRouterHistory: mockSuiteRouterHistory() }),
    });

    renderWithProviders(
        { ...services, networks: mockNetworksServices() },
        <YieldPositionCard position={position} />,
    );

    return services.store;
};

describe('YieldPositionCard', () => {
    it('opens the vault detail of the position', async () => {
        const store = renderCard();

        await userEvent.click(screen.getByText('Vault USDC'));

        await waitFor(() => {
            expect(store.getState().router.route?.name).toBe('earn-yield-vault');
        });
        expect(store.getState().router.params).toMatchObject({
            symbol: 'eth',
            accountIndex: ethAccount.index,
            accountType: ethAccount.accountType,
            vaultAddress: RECEIPT_TOKEN_CONTRACT.toLowerCase(),
        });
    });
});
