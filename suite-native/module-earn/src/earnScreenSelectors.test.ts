import { deviceInitialState, portfolioTrackerDevice } from '@suite-common/device';
import { mockStakingState } from '@suite-common/earn-staking/mocks';
import { mockStakingProductDescriptor } from '@suite-common/earn-staking-common/mocks';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { appSettingsInitialState } from '@suite-native/settings';
import { DeviceModelInternal, FirmwareType } from '@trezor/device-utils';

import { selectStakingPromoListDescriptors } from './earnScreenSelectors';

const mainnetSymbols = (['eth', 'sol', 'trx', 'ada'] as const).map(asNetworkSymbol);
const allSymbols = [...mainnetSymbols, asNetworkSymbol('dsol')];
const staking = mockStakingState({
    platform: 'mobile',
    descriptors: allSymbols.map(networkSymbol => mockStakingProductDescriptor({ networkSymbol })),
});

const createState = (device?: TrezorDevice, areTestnetsEnabled = false) => ({
    device: {
        ...deviceInitialState,
        selectedDevice: device,
        devices: device ? [device] : [],
    },
    earn: { staking },
    networks: mockNetworksState(allSymbols),
    appSettings: { ...appSettingsInitialState, areTestnetsEnabled },
});

const modelOne = mockSuiteDevice(
    {
        connected: true,
        available: true,
        unavailableCapabilities: {
            [asNetworkSymbol('sol')]: 'no-support',
            [asNetworkSymbol('dsol')]: 'no-support',
            [asNetworkSymbol('ada')]: 'no-support',
            [asNetworkSymbol('trx')]: 'no-support',
        },
    },
    {
        major_version: 1,
        minor_version: 14,
        patch_version: 2,
        internal_model: DeviceModelInternal.T1B1,
    },
);

const getPromoSymbols = (state: ReturnType<typeof createState>) =>
    selectStakingPromoListDescriptors(state).map(({ networkSymbol }) => networkSymbol);

describe('selectStakingPromoListDescriptors', () => {
    it('keeps every staking opportunity visible for Model One', () => {
        expect(getPromoSymbols(createState(modelOne))).toEqual(mainnetSymbols);
    });

    it('keeps testnet opportunities visible too', () => {
        expect(getPromoSymbols(createState(modelOne, true))).toEqual(allSymbols);
    });

    it('keeps opportunities visible on Bitcoin-only firmware', () => {
        expect(
            getPromoSymbols(
                createState(mockSuiteDevice({ firmwareType: FirmwareType.BitcoinOnly })),
            ),
        ).toEqual(mainnetSymbols);
    });

    it('preserves Portfolio Tracker exploration', () => {
        expect(getPromoSymbols(createState(portfolioTrackerDevice))).toEqual(mainnetSymbols);
    });
});
