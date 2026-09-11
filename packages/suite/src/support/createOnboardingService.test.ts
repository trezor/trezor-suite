import { recoveryActions } from '@suite/recovery';
import { DeviceTrackingPhase } from '@suite-common/device';
import { firmwareActions } from '@suite-common/firmware';
import { type TrezorDevice } from '@suite-common/suite-types';

import { type AppState } from 'src/types/suite';

import { createOnboardingService } from './createOnboardingService';

const getState = ({
    isOnboardingInProgress = false,
    recoveryStatus = 'initial',
    isAnalyticsConfirmed = true,
}: {
    isOnboardingInProgress?: boolean;
    recoveryStatus?: string;
    isAnalyticsConfirmed?: boolean;
} = {}) =>
    ({
        onboarding: {
            deviceTracking: {
                phase: isOnboardingInProgress
                    ? DeviceTrackingPhase.Tracking
                    : DeviceTrackingPhase.Idle,
                initialRef: undefined,
                currentRef: undefined,
            },
        },
        device: { devices: [] },
        recovery: { status: recoveryStatus },
        analytics: { confirmed: isAnalyticsConfirmed },
    }) as unknown as AppState;

const deviceInRecovery = {
    features: { recovery_status: 'Recovery' },
} as unknown as TrezorDevice;

const createService = (state: AppState) => {
    const dispatch = jest.fn();

    return {
        dispatch,
        service: createOnboardingService({ dispatch, getState: () => state }),
    };
};

describe('createOnboardingService', () => {
    describe('onFirmwareInstallationFinished', () => {
        it('does nothing for an installation that did not go through THP pairing', () => {
            const { dispatch, service } = createService(getState({ isOnboardingInProgress: true }));

            service.onFirmwareInstallationFinished({ wasThpPairing: false });

            expect(dispatch).not.toHaveBeenCalled();
        });

        it('does nothing when no onboarding is in progress', () => {
            const { dispatch, service } = createService(
                getState({ isOnboardingInProgress: false }),
            );

            service.onFirmwareInstallationFinished({ wasThpPairing: true });

            expect(dispatch).not.toHaveBeenCalled();
        });

        it('moves onboarding on and resets the firmware flow after THP pairing', () => {
            const { dispatch, service } = createService(getState({ isOnboardingInProgress: true }));

            service.onFirmwareInstallationFinished({ wasThpPairing: true });

            expect(dispatch).toHaveBeenCalledTimes(2);
            expect(dispatch).toHaveBeenLastCalledWith(firmwareActions.resetReducer());
        });
    });

    describe('onSelectedDeviceUpdated', () => {
        it('ignores a device that is not mid-recovery', () => {
            const { dispatch, service } = createService(getState());

            service.onSelectedDeviceUpdated({
                features: { recovery_status: 'Nothing' },
            } as unknown as TrezorDevice);

            expect(dispatch).not.toHaveBeenCalled();
        });

        it('ignores a device mid-recovery once recovery is already running', () => {
            const { dispatch, service } = createService(
                getState({ recoveryStatus: 'in-progress' }),
            );

            service.onSelectedDeviceUpdated(deviceInRecovery);

            expect(dispatch).not.toHaveBeenCalled();
        });

        it('only marks recovery in progress while analytics is unconfirmed, so the opt-out shows first', () => {
            const { dispatch, service } = createService(getState({ isAnalyticsConfirmed: false }));

            service.onSelectedDeviceUpdated(deviceInRecovery);

            expect(dispatch).toHaveBeenCalledTimes(2);
            expect(dispatch).toHaveBeenLastCalledWith(recoveryActions.setStatus('in-progress'));
        });

        it('reruns recovery once analytics is confirmed', () => {
            const { dispatch, service } = createService(getState());

            service.onSelectedDeviceUpdated(deviceInRecovery);

            expect(dispatch).toHaveBeenCalledTimes(2);
            expect(dispatch).toHaveBeenLastCalledWith(expect.any(Function));
        });
    });
});
