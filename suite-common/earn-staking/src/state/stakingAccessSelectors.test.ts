import { type DeviceRootState, deviceInitialState } from '@suite-common/device';
import { mockStakingProductDescriptor } from '@suite-common/earn-staking-common/mocks';
import {
    type MessageSystemRootState,
    type MessageSystemState,
    messageSystemInitialState,
} from '@suite-common/message-system';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { selectStakingProductAccess } from './stakingAccessSelectors';
import { type StakingRootState, stakingInitialState } from './stakingReducer';
import { mockStakingState } from '../../mocks';

const disableFeatures = (domains: readonly string[]): MessageSystemState =>
    ({
        ...messageSystemInitialState,
        config: {
            version: 1,
            timestamp: '2023-01-01',
            sequence: 1,
            actions: [
                {
                    message: {
                        id: 'disabled',
                        priority: 1,
                        dismissible: false,
                        category: ['feature'],
                        content: { en: 'Disabled' },
                        feature: domains.map(domain => ({ domain, flag: false })),
                    },
                },
            ],
            experiments: [],
        },
        validMessages: { banner: [], context: [], modal: [], feature: ['disabled'] },
    }) as unknown as MessageSystemState;

const manage = mockStakingProductDescriptor();
const subset = mockStakingProductDescriptor({
    symbol: asNetworkSymbol('sol'),
    type: 'native',
    platforms: {
        desktop: { access: 'manage', operations: ['stake', 'unstake'] },
        mobile: { access: 'listed' },
    },
});
const readOnly = mockStakingProductDescriptor({
    symbol: asNetworkSymbol('ada'),
    type: 'native',
    platforms: { desktop: { access: 'read-only' }, mobile: { access: 'hidden' } },
});

type AccessState = StakingRootState & MessageSystemRootState & DeviceRootState;

type StateParams = {
    platform?: 'desktop' | 'mobile';
    disabled?: readonly string[];
    viewOnly?: boolean;
};

const createState = ({ platform = 'desktop', disabled = [], viewOnly = false }: StateParams = {}) =>
    ({
        staking: mockStakingState({ platform, descriptors: [manage, subset, readOnly] }),
        messageSystem: disabled.length > 0 ? disableFeatures(disabled) : messageSystemInitialState,
        device: {
            ...deviceInitialState,
            selectedDevice: mockSuiteDevice({ connected: !viewOnly, remember: viewOnly }),
        },
    }) satisfies AccessState;

describe('selectStakingProductAccess', () => {
    it('hides a product that is not registered', () => {
        const unknown = mockStakingProductDescriptor({ symbol: asNetworkSymbol('trx') });

        expect(selectStakingProductAccess(createState(), unknown.id)).toEqual({
            access: 'hidden',
            operations: [],
        });
    });

    it('hides every product before the platform is registered', () => {
        const state = { ...createState(), staking: stakingInitialState };

        expect(selectStakingProductAccess(state, manage.id).access).toBe('hidden');
    });

    it('returns the platform entry as is when it is not manage', () => {
        expect(selectStakingProductAccess(createState(), readOnly.id)).toEqual({
            access: 'read-only',
            operations: [],
        });
        expect(
            selectStakingProductAccess(createState({ platform: 'mobile' }), readOnly.id),
        ).toEqual({
            access: 'hidden',
            operations: [],
        });
        expect(selectStakingProductAccess(createState({ platform: 'mobile' }), subset.id)).toEqual({
            access: 'listed',
            operations: [],
        });
    });

    it('manages with the descriptor operations by default', () => {
        expect(selectStakingProductAccess(createState(), manage.id)).toEqual({
            access: 'manage',
            operations: ['stake', 'unstake', 'withdraw'],
        });
    });

    it('limits management to the platform subset', () => {
        expect(selectStakingProductAccess(createState(), subset.id)).toEqual({
            access: 'manage',
            operations: ['stake', 'unstake'],
        });
    });

    it('drops an operation the message system disabled', () => {
        const state = createState({ disabled: ['eth.staking.stake'] });

        expect(selectStakingProductAccess(state, manage.id)).toEqual({
            access: 'manage',
            operations: ['unstake', 'withdraw'],
        });
    });

    it('keeps an operation without a message system feature', () => {
        const state = createState({ disabled: ['sol.staking.stake', 'sol.staking.unstake'] });

        expect(selectStakingProductAccess(state, subset.id).operations).toEqual([
            'stake',
            'unstake',
        ]);
    });

    it('falls back to read-only when every operation is disabled', () => {
        const state = createState({
            disabled: ['eth.staking.stake', 'eth.staking.unstake', 'eth.staking.claim'],
        });

        expect(selectStakingProductAccess(state, manage.id)).toEqual({
            access: 'read-only',
            operations: [],
        });
    });

    it('falls back to read-only for a device in view-only mode', () => {
        expect(selectStakingProductAccess(createState({ viewOnly: true }), manage.id)).toEqual({
            access: 'read-only',
            operations: [],
        });
    });

    it('returns the same reference for the same inputs', () => {
        const state = createState();

        expect(selectStakingProductAccess(state, manage.id)).toBe(
            selectStakingProductAccess(state, manage.id),
        );
    });
});
