import { Alert } from 'react-native';

import * as SplashScreen from 'expo-splash-screen';

import { createMockDeps } from '@trezor/dependency-injection';

import {
    type AlertStorageLoadFailureDeps,
    createAlertStorageLoadFailure,
} from './createAlertStorageLoadFailure';

jest.mock('expo-splash-screen', () => ({ hideAsync: jest.fn(() => Promise.resolve()) }));

const pressAlertButton = (text: string) => {
    const buttons = jest.mocked(Alert.alert).mock.calls[0]?.[2] ?? [];

    buttons.find(button => button.text === text)?.onPress?.();
};

describe('createAlertStorageLoadFailure', () => {
    beforeEach(() => {
        jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    it('hides the splash screen so the alert is visible', () => {
        const deps = createMockDeps<AlertStorageLoadFailureDeps>({
            clearStorage: null,
            reloadApp: null,
        });

        createAlertStorageLoadFailure(deps)();

        expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
        expect(Alert.alert).toHaveBeenCalledTimes(1);
        expect(Alert.alert).toHaveBeenCalledWith(
            'Unable to load app data',
            expect.any(String),
            expect.any(Array),
        );
    });

    it('restarts the app without clearing storage', () => {
        const deps = createMockDeps<AlertStorageLoadFailureDeps>({
            clearStorage: null,
            reloadApp: () => {},
        });

        createAlertStorageLoadFailure(deps)();
        pressAlertButton('Restart app');

        expect(deps.reloadApp).toHaveBeenCalledTimes(1);
    });

    it('clears storage that never opened before restarting the app', () => {
        const callOrder: string[] = [];
        const deps = createMockDeps<AlertStorageLoadFailureDeps>({
            clearStorage: () => {
                callOrder.push('clearStorage');
            },
            reloadApp: () => {
                callOrder.push('reloadApp');
            },
        });

        createAlertStorageLoadFailure(deps)();
        pressAlertButton('Clear app storage');

        expect(deps.clearStorage).toHaveBeenCalledWith({ mmkvInstance: null });
        expect(callOrder).toEqual(['clearStorage', 'reloadApp']);
    });
});
