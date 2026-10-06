import {
    type DeviceRootState,
    deviceInitialState,
    portfolioTrackerDevice,
} from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type FeesState } from '@suite-common/wallet-types';
import { DeviceModelInternal } from '@trezor/device-utils';

import { selectIsWrappedNativeFlowSupported, selectYieldGasReserve } from './yieldSelectors';
import { type FeesRootState } from '../fees/feesSelectors';

const createState = (selectedDevice?: TrezorDevice): DeviceRootState => ({
    device: { ...deviceInitialState, selectedDevice },
});

const createStateWithFirmware = ([major, minor, patch]: [number, number, number]) =>
    createState(
        mockSuiteDevice({}, { major_version: major, minor_version: minor, patch_version: patch }),
    );

describe('selectIsWrappedNativeFlowSupported', () => {
    it('returns false when no device is selected', () => {
        expect(selectIsWrappedNativeFlowSupported(createState())).toBe(false);
    });

    it('requires firmware 2.12.4', () => {
        expect(selectIsWrappedNativeFlowSupported(createStateWithFirmware([2, 12, 3]))).toBe(false);
        expect(selectIsWrappedNativeFlowSupported(createStateWithFirmware([2, 12, 4]))).toBe(true);
    });

    it('returns true for T1B1 regardless of firmware version', () => {
        const device = mockSuiteDevice(
            {},
            {
                internal_model: DeviceModelInternal.T1B1,
                major_version: 1,
                minor_version: 10,
                patch_version: 0,
            },
        );

        expect(selectIsWrappedNativeFlowSupported(createState(device))).toBe(true);
    });

    it('returns false for the portfolio-tracker device', () => {
        expect(selectIsWrappedNativeFlowSupported(createState(portfolioTrackerDevice))).toBe(false);
    });
});

describe('selectYieldGasReserve', () => {
    const ethSymbol = asNetworkSymbol('eth');
    const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';

    const createFeesState = (fees: FeesState): FeesRootState => ({ wallet: { fees } });

    // Raw fee info is in wei; the selector converts it to gwei before sizing the reserve.
    const loadedFees = createFeesState({
        [ethSymbol]: {
            status: 'loaded',
            data: {
                blockHeight: 1,
                blockTime: 12,
                minFee: 1,
                maxFee: 100,
                minPriorityFee: 1,
                levels: [{ label: 'normal', feePerUnit: '1000000000', blocks: 2 }],
            },
        },
    });

    it('returns null while the network has no fee estimate', () => {
        expect(
            selectYieldGasReserve(createFeesState({}), ethSymbol, true, WETH_ADDRESS),
        ).toBeNull();
        expect(
            selectYieldGasReserve(
                createFeesState({ [ethSymbol]: { status: 'loading' } }),
                ethSymbol,
                true,
                WETH_ADDRESS,
            ),
        ).toBeNull();
    });

    it('sizes the reserve from the normal fee level', () => {
        expect(selectYieldGasReserve(loadedFees, ethSymbol, true, WETH_ADDRESS)).toEqual({
            minimum: '0.001',
            recommended: '0.005',
        });
    });

    it('returns a stable reference for the same inputs', () => {
        const first = selectYieldGasReserve(loadedFees, ethSymbol, true, WETH_ADDRESS);
        const second = selectYieldGasReserve(loadedFees, ethSymbol, true, WETH_ADDRESS);

        expect(second).toBe(first);
    });
});
