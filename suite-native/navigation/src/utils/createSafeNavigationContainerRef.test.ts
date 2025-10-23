import { createNavigationContainerRef } from '@react-navigation/native';

import { createSafeNavigationContainerRef } from './createSafeNavigationContainerRef';
import {
    AuthorizeDeviceStackRoutes,
    DeviceOnboardingStackRoutes,
    RootStackRoutes,
} from '../routes';

jest.mock('@react-navigation/native', () => ({
    createNavigationContainerRef: jest.fn(),
}));

describe('createSafeNavigationContainerRef', () => {
    let mockNavigationRef: any;
    let mockNavigate: jest.Mock;
    let mockIsReady: jest.Mock;

    beforeEach(() => {
        mockNavigate = jest.fn();
        mockIsReady = jest.fn(() => true);

        mockNavigationRef = {
            navigate: mockNavigate,
            isReady: mockIsReady,
        };

        (createNavigationContainerRef as jest.Mock).mockReturnValue(mockNavigationRef);
    });

    it('should call navigate when navigation is ready', () => {
        mockIsReady.mockReturnValue(true);

        const safeRef = createSafeNavigationContainerRef();
        safeRef.navigate(RootStackRoutes.DeviceOnboardingStack, {
            screen: DeviceOnboardingStackRoutes.DeviceDisconnected,
            params: { wasDeviceConnectedViaBluetooth: false },
        });

        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.DeviceOnboardingStack, {
            screen: DeviceOnboardingStackRoutes.DeviceDisconnected,
            params: { wasDeviceConnectedViaBluetooth: false },
        });
    });

    it('should NOT call navigate when navigation is not ready', () => {
        mockIsReady.mockReturnValue(false);

        const safeRef = createSafeNavigationContainerRef();
        const result = safeRef.navigate(RootStackRoutes.AuthorizeDeviceStack, {
            screen: AuthorizeDeviceStackRoutes.ThpConfirmation,
        });

        expect(mockNavigate).not.toHaveBeenCalled();
        expect(result).toBeUndefined();
    });

    it('should handle transition from not ready to ready', () => {
        mockIsReady.mockReturnValue(false);

        const safeRef = createSafeNavigationContainerRef();
        safeRef.navigate(RootStackRoutes.AuthorizeDeviceStack, {
            screen: AuthorizeDeviceStackRoutes.ThpConfirmation,
        });

        mockIsReady.mockReturnValue(true);
        safeRef.navigate(RootStackRoutes.AuthorizeDeviceStack, {
            screen: AuthorizeDeviceStackRoutes.ThpConfirmation,
        });

        expect(mockNavigate).toHaveBeenCalledTimes(1);
    });
});
