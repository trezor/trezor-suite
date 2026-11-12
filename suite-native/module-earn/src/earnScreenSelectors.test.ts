import { deviceInitialState, portfolioTrackerDevice } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { getStakingPromoListSymbols } from '@suite-common/wallet-core';
import { appSettingsInitialState } from '@suite-native/settings';
import { DeviceModelInternal, FirmwareType } from '@trezor/device-utils';

import { selectStakingPromoListSymbols } from './earnScreenSelectors';

const createState = (device?: TrezorDevice, areTestnetsEnabled = false) => ({
    device: {
        ...deviceInitialState,
        selectedDevice: device,
        devices: device ? [device] : [],
    },
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

describe('selectStakingPromoListSymbols', () => {
    it('keeps every staking opportunity visible for Model One', () => {
        expect(selectStakingPromoListSymbols(createState(modelOne))).toEqual([
            'eth',
            'sol',
            'trx',
            'ada',
        ]);
    });

    it('keeps testnet opportunities visible too', () => {
        expect(selectStakingPromoListSymbols(createState(modelOne, true))).toEqual(
            getStakingPromoListSymbols(true),
        );
    });

    it('keeps opportunities visible on Bitcoin-only firmware', () => {
        expect(
            selectStakingPromoListSymbols(
                createState(mockSuiteDevice({ firmwareType: FirmwareType.BitcoinOnly })),
            ),
        ).toEqual(getStakingPromoListSymbols(false));
    });

    it('preserves Portfolio Tracker exploration', () => {
        expect(selectStakingPromoListSymbols(createState(portfolioTrackerDevice))).toEqual(
            getStakingPromoListSymbols(false),
        );
    });
});
