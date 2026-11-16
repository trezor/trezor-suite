/**
 * @jest-environment jsdom
 */
import { combineReducers } from '@reduxjs/toolkit';

import { type DeviceRootState, deviceInitialState } from '@suite-common/device';
import type { StakingProductId } from '@suite-common/earn-staking-common';
import { mockStakingProductDescriptor } from '@suite-common/earn-staking-common/mocks';
import {
    type MessageSystemRootState,
    messageSystemInitialState,
} from '@suite-common/message-system';
import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { useStakingAccess } from './useStakingAccess';
import { mockStakingServices, mockStakingState } from '../../mocks';
import type { StakingDep } from '../stakingServices';
import { type StakingRootState, stakingReducer } from '../state/stakingReducer';

type HookDeps = { services: StakingDep };
type HookState = StakingRootState & MessageSystemRootState & DeviceRootState;

const eth = mockStakingProductDescriptor();

const renderStakingAccess = (productId: StakingProductId | null) => {
    const { services } = createTestCompositionRoot<HookDeps, HookState>({
        reducer: {
            earn: combineReducers({ staking: stakingReducer }),
            messageSystem: (state = messageSystemInitialState) => state,
            device: (state = deviceInitialState) => state,
        },
        preloadedState: {
            earn: { staking: mockStakingState({ descriptors: [eth] }) },
            messageSystem: messageSystemInitialState,
            device: deviceInitialState,
        },
        services: () => ({ staking: mockStakingServices() }),
    });

    return renderHookWithStoreProvider(() => useStakingAccess(productId), { services });
};

describe('useStakingAccess', () => {
    it('resolves the access of a registered product', () => {
        expect(renderStakingAccess(eth.id).result.current).toEqual({
            access: 'manage',
            operations: ['stake', 'unstake', 'withdraw'],
            disabled: {},
        });
    });

    it('hides a product that is not registered', () => {
        const unknown = mockStakingProductDescriptor({ networkSymbol: asNetworkSymbol('sol') });

        expect(renderStakingAccess(unknown.id).result.current.access).toBe('hidden');
    });

    it('hides for no product, with one reference', () => {
        expect(renderStakingAccess(null).result.current).toEqual({
            access: 'hidden',
            operations: [],
            disabled: {},
        });
        expect(renderStakingAccess(null).result.current).toBe(
            renderStakingAccess(null).result.current,
        );
    });
});
