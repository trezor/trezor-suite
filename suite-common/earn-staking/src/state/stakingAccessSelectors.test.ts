import { type DeviceRootState, deviceInitialState } from '@suite-common/device';
import { stakingProviderIdSchema } from '@suite-common/earn-staking-common';
import { mockStakingProductDescriptor } from '@suite-common/earn-staking-common/mocks';
import {
    type MessageSystemRootState,
    type MessageSystemState,
    messageSystemInitialState,
} from '@suite-common/message-system';
import { type NetworksRootState } from '@suite-common/networks';
import { mockNetworksState } from '@suite-common/networks/mocks';
import type { TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol, asNetworkSymbols } from '@trezor/network-module-types';
import type { VersionArray } from '@trezor/utils';

import {
    selectStakeableStakingProductDescriptorsBySymbol,
    selectStakingOperationMessageContent,
    selectStakingProductAccess,
    selectStakingPromoProductDescriptors,
} from './stakingAccessSelectors';
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
                        content: { en: 'Disabled', cs: 'Vypnuto' },
                        feature: domains.map(domain => ({ domain, flag: false })),
                    },
                },
            ],
            experiments: [],
        },
        validMessages: { banner: [], context: [], modal: [], feature: ['disabled'] },
    }) as unknown as MessageSystemState;

const manage = mockStakingProductDescriptor();
const testnet = mockStakingProductDescriptor({
    networkSymbol: asNetworkSymbol('thod'),
    messageSystemFeatures: {},
});
const subset = mockStakingProductDescriptor({
    networkSymbol: asNetworkSymbol('sol'),
    type: 'native',
    platforms: {
        desktop: { access: 'manage', operations: ['stake', 'unstake'] },
        mobile: { access: 'listed' },
    },
});
const external = mockStakingProductDescriptor({
    networkSymbol: asNetworkSymbol('sol'),
    providerId: stakingProviderIdSchema.parse('external'),
    type: 'native',
    operations: [],
    consentKey: null,
    platforms: { desktop: { access: 'read-only' }, mobile: { access: 'read-only' } },
    isCountedInAccountTotals: false,
});
const readOnly = mockStakingProductDescriptor({
    networkSymbol: asNetworkSymbol('ada'),
    type: 'native',
    platforms: { desktop: { access: 'read-only' }, mobile: { access: 'hidden' } },
});
const gated = mockStakingProductDescriptor({
    networkSymbol: asNetworkSymbol('trx'),
    providerId: stakingProviderIdSchema.parse('curated'),
    type: 'native',
    operations: ['stake', 'unstake', 'withdraw', 'claim', 'vote'],
    rateKind: 'apr',
    rewardsKind: 'claimable',
    platforms: { desktop: { access: 'manage' }, mobile: { access: 'read-only' } },
    messageSystemFeatures: { stake: 'trx.staking.stake', claim: 'trx.staking.claim' },
    minFirmware: { claim: '2.12.2' },
});

// In reverse coin order, so the promo selector has to sort.
const DESCRIPTORS = [gated, readOnly, external, subset, testnet, manage];

type AccessState = StakingRootState & MessageSystemRootState & DeviceRootState & NetworksRootState;

const createDevice = (firmware: VersionArray, viewOnly = false): TrezorDevice => {
    const device = mockSuiteDevice({ connected: !viewOnly, remember: viewOnly });

    if (device.type !== 'acquired') {
        throw new Error('Expected an acquired device');
    }

    const [major_version, minor_version, patch_version] = firmware;

    return {
        ...device,
        features: { ...device.features, major_version, minor_version, patch_version },
    };
};

type StateParams = {
    platform?: 'desktop' | 'mobile';
    disabled?: readonly string[];
    device?: TrezorDevice;
};

const createState = ({
    platform = 'desktop',
    disabled = [],
    device = createDevice([2, 12, 2]),
}: StateParams = {}): AccessState => ({
    earn: { staking: mockStakingState({ platform, descriptors: DESCRIPTORS }) },
    messageSystem: disabled.length > 0 ? disableFeatures(disabled) : messageSystemInitialState,
    device: { ...deviceInitialState, selectedDevice: device },
    networks: mockNetworksState(asNetworkSymbols(['btc', 'eth', 'thod', 'sol', 'ada', 'trx'])),
});

describe('selectStakingProductAccess', () => {
    it('hides a product that is not registered', () => {
        const unknown = mockStakingProductDescriptor({ networkSymbol: asNetworkSymbol('dsol') });

        expect(selectStakingProductAccess(createState(), unknown.id)).toEqual({
            access: 'hidden',
            operations: [],
            disabled: {},
        });
    });

    it('hides every product before the platform is registered', () => {
        const state = { ...createState(), earn: { staking: stakingInitialState } };

        expect(selectStakingProductAccess(state, manage.id).access).toBe('hidden');
    });

    it('returns the platform entry as is when it is not manage', () => {
        expect(selectStakingProductAccess(createState(), readOnly.id)).toEqual({
            access: 'read-only',
            operations: [],
            disabled: {},
        });
        expect(
            selectStakingProductAccess(createState({ platform: 'mobile' }), readOnly.id),
        ).toEqual({ access: 'hidden', operations: [], disabled: {} });
        expect(selectStakingProductAccess(createState({ platform: 'mobile' }), subset.id)).toEqual({
            access: 'listed',
            operations: [],
            disabled: {},
        });
    });

    it('manages with the descriptor operations by default', () => {
        expect(selectStakingProductAccess(createState(), manage.id)).toEqual({
            access: 'manage',
            operations: ['stake', 'unstake', 'withdraw'],
            disabled: {},
        });
    });

    it('limits management to the platform subset', () => {
        expect(selectStakingProductAccess(createState(), subset.id)).toEqual({
            access: 'manage',
            operations: ['stake', 'unstake'],
            disabled: {},
        });
    });

    it('withholds an operation the message system disabled and says so', () => {
        const state = createState({ disabled: ['eth.staking.stake'] });

        expect(selectStakingProductAccess(state, manage.id)).toEqual({
            access: 'manage',
            operations: ['unstake', 'withdraw'],
            disabled: { stake: { kind: 'message-system', feature: 'eth.staking.stake' } },
        });
    });

    it('keeps an operation without a message system feature', () => {
        const state = createState({ disabled: ['sol.staking.stake', 'sol.staking.unstake'] });

        expect(selectStakingProductAccess(state, subset.id)).toEqual({
            access: 'manage',
            operations: ['stake', 'unstake'],
            disabled: {},
        });
    });

    it('stays manageable with every operation withheld and its reason', () => {
        const state = createState({
            disabled: ['eth.staking.stake', 'eth.staking.unstake', 'eth.staking.claim'],
        });

        expect(selectStakingProductAccess(state, manage.id)).toEqual({
            access: 'manage',
            operations: [],
            disabled: {
                stake: { kind: 'message-system', feature: 'eth.staking.stake' },
                unstake: { kind: 'message-system', feature: 'eth.staking.unstake' },
                withdraw: { kind: 'message-system', feature: 'eth.staking.claim' },
            },
        });
    });

    it.each([
        { name: 'at the minimum firmware', firmware: [2, 12, 2] as VersionArray },
        { name: 'above the minimum firmware', firmware: [3, 0, 0] as VersionArray },
    ])('allows a gated operation $name', ({ firmware }) => {
        const state = createState({ device: createDevice(firmware) });

        expect(selectStakingProductAccess(state, gated.id)).toEqual({
            access: 'manage',
            operations: ['stake', 'unstake', 'withdraw', 'claim', 'vote'],
            disabled: {},
        });
    });

    it('withholds a gated operation below the minimum firmware', () => {
        const state = createState({ device: createDevice([2, 12, 1]) });

        expect(selectStakingProductAccess(state, gated.id)).toEqual({
            access: 'manage',
            operations: ['stake', 'unstake', 'withdraw', 'vote'],
            disabled: { claim: { kind: 'firmware', minFirmware: '2.12.2' } },
        });
    });

    it('withholds a gated operation while the firmware version is unknown', () => {
        const state: AccessState = {
            ...createState(),
            device: { ...deviceInitialState, selectedDevice: undefined },
        };

        expect(selectStakingProductAccess(state, gated.id).disabled).toEqual({
            claim: { kind: 'firmware', minFirmware: '2.12.2' },
        });
    });

    it('reports the message system before the firmware when both withhold an operation', () => {
        const state = createState({
            disabled: ['trx.staking.claim'],
            device: createDevice([2, 12, 1]),
        });

        expect(selectStakingProductAccess(state, gated.id).disabled).toEqual({
            claim: { kind: 'message-system', feature: 'trx.staking.claim' },
        });
    });

    it('leaves view-only mode to the apps', () => {
        const state = createState({ device: createDevice([2, 12, 2], true) });

        expect(selectStakingProductAccess(state, manage.id)).toEqual({
            access: 'manage',
            operations: ['stake', 'unstake', 'withdraw'],
            disabled: {},
        });
    });

    it('returns the same reference for the same inputs', () => {
        const state = createState();

        expect(selectStakingProductAccess(state, manage.id)).toBe(
            selectStakingProductAccess(state, manage.id),
        );
    });
});

describe('selectStakingOperationMessageContent', () => {
    it('resolves the message of a disabled operation in the locale', () => {
        const state = createState({ disabled: ['eth.staking.stake'] });

        expect(selectStakingOperationMessageContent(state, manage.id, 'stake', 'en')).toBe(
            'Disabled',
        );
        expect(selectStakingOperationMessageContent(state, manage.id, 'stake', 'cs')).toBe(
            'Vypnuto',
        );
    });

    it.each([
        { name: 'an operation without a message', operation: 'unstake' as const },
        { name: 'an operation without a feature key', operation: 'vote' as const },
    ])('is null for $name', ({ operation }) => {
        const state = createState({ disabled: ['eth.staking.stake'] });

        expect(selectStakingOperationMessageContent(state, manage.id, operation, 'en')).toBeNull();
    });

    it('is null for a product that is not registered', () => {
        const unknown = mockStakingProductDescriptor({ networkSymbol: asNetworkSymbol('dsol') });

        expect(selectStakingOperationMessageContent(createState(), unknown.id, 'stake', 'en')).toBe(
            null,
        );
    });
});

describe('selectStakeableStakingProductDescriptorsBySymbol', () => {
    it('lists the products of the network that offer stake and are shown on the platform', () => {
        const state = createState();

        expect(
            selectStakeableStakingProductDescriptorsBySymbol(state, asNetworkSymbol('sol')),
        ).toEqual([subset]);
        expect(
            selectStakeableStakingProductDescriptorsBySymbol(state, asNetworkSymbol('ada')),
        ).toEqual([readOnly]);
    });

    it('leaves out a product hidden on the platform', () => {
        const state = createState({ platform: 'mobile' });

        expect(
            selectStakeableStakingProductDescriptorsBySymbol(state, asNetworkSymbol('ada')),
        ).toBe(selectStakeableStakingProductDescriptorsBySymbol(state, asNetworkSymbol('btc')));
    });

    it('keeps the reference across a recreated state', () => {
        expect(
            selectStakeableStakingProductDescriptorsBySymbol(createState(), asNetworkSymbol('eth')),
        ).toBe(
            selectStakeableStakingProductDescriptorsBySymbol(createState(), asNetworkSymbol('eth')),
        );
    });
});

describe('selectStakingPromoProductDescriptors', () => {
    it('lists the mainnet products in coin order while testnets are off', () => {
        expect(
            selectStakingPromoProductDescriptors(createState(), false).map(({ id }) => id),
        ).toEqual([manage.id, subset.id, readOnly.id, gated.id]);
    });

    it('adds the testnet products while testnets are on', () => {
        expect(
            selectStakingPromoProductDescriptors(createState(), true).map(({ id }) => id),
        ).toEqual([manage.id, testnet.id, subset.id, readOnly.id, gated.id]);
    });

    it('leaves out products hidden on the platform', () => {
        expect(
            selectStakingPromoProductDescriptors(createState({ platform: 'mobile' }), false).map(
                ({ id }) => id,
            ),
        ).toEqual([manage.id, subset.id, gated.id]);
    });

    it('keeps the reference across a recreated state', () => {
        expect(selectStakingPromoProductDescriptors(createState(), false)).toBe(
            selectStakingPromoProductDescriptors(createState(), false),
        );
    });
});
