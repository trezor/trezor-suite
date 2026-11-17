/**
 * @jest-environment jsdom
 */
import { combineReducers } from '@reduxjs/toolkit';

import { type DeviceRootState, deviceInitialState } from '@suite-common/device';
import {
    mockStakingPosition,
    mockStakingProductDescriptor,
} from '@suite-common/earn-staking-common/mocks';
import {
    type MessageSystemRootState,
    messageSystemInitialState,
} from '@suite-common/message-system';
import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import type { AccountsRootState } from '@suite-common/wallet-core';
import { type Account, type AccountKey, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { useStakingAccountPosition } from './useStakingAccountPosition';
import { mockStakingServices, mockStakingState } from '../../mocks';
import type { StakingDep } from '../stakingServices';
import { type StakingRootState, stakingReducer } from '../state/stakingReducer';

type HookDeps = { services: StakingDep };
type HookState = StakingRootState & AccountsRootState & MessageSystemRootState & DeviceRootState;

const eth = mockStakingProductDescriptor();
const ethPosition = mockStakingPosition();

const stakedAccount = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const unstakedAccount = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    descriptor: asAccountDescriptor('unstaked'),
});
const btcAccount = mockWalletAccount({ symbol: asNetworkSymbol('btc') });
const accounts: Account[] = [stakedAccount, unstakedAccount, btcAccount];

const ZERO_TOTALS = {
    staked: '0',
    pending: '0',
    unstaking: '0',
    withdrawable: '0',
    rewards: '0',
};

const renderStakingAccountPosition = (accountKey: AccountKey) => {
    const { services } = createTestCompositionRoot<HookDeps, HookState>({
        reducer: {
            earn: combineReducers({ staking: stakingReducer }),
            wallet: combineReducers({ accounts: (state: Account[] = []) => state }),
            messageSystem: (state = messageSystemInitialState) => state,
            device: (state = deviceInitialState) => state,
        },
        preloadedState: {
            earn: {
                staking: mockStakingState({
                    descriptors: [eth],
                    positions: { [stakedAccount.key]: [ethPosition] },
                }),
            },
            wallet: { accounts },
            messageSystem: messageSystemInitialState,
            device: deviceInitialState,
        },
        services: () => ({ staking: mockStakingServices() }),
    });

    return renderHookWithStoreProvider(() => useStakingAccountPosition(accountKey), { services });
};

describe('useStakingAccountPosition', () => {
    it('reads the position of a staked account with its product, totals and access', () => {
        expect(renderStakingAccountPosition(stakedAccount.key).result.current).toEqual({
            productId: eth.id,
            descriptor: eth,
            position: ethPosition,
            totals: {
                staked: '2000000000000000000',
                pending: '0',
                unstaking: '500000000000000000',
                withdrawable: '0',
                rewards: '12000000000000000',
            },
            access: {
                access: 'manage',
                operations: ['stake', 'unstake', 'withdraw'],
                disabled: {},
            },
        });
    });

    it('resolves the product the network stakes on for an account without a position', () => {
        expect(renderStakingAccountPosition(unstakedAccount.key).result.current).toEqual({
            productId: eth.id,
            descriptor: eth,
            position: null,
            totals: ZERO_TOTALS,
            access: {
                access: 'manage',
                operations: ['stake', 'unstake', 'withdraw'],
                disabled: {},
            },
        });
    });

    it('knows no product for an account of a network without staking', () => {
        expect(renderStakingAccountPosition(btcAccount.key).result.current).toEqual({
            productId: null,
            descriptor: null,
            position: null,
            totals: ZERO_TOTALS,
            access: { access: 'hidden', operations: [], disabled: {} },
        });
    });
});
