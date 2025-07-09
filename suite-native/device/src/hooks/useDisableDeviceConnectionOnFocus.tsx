import { useCallback } from 'react';

import { useFocusEffect } from '@react-navigation/native';

import {
    restartDeviceConnectionListening,
    stopDeviceConnectionListening,
} from '../middlewares/deviceConnectionMiddleware';

export const useDisableDeviceConnectionOnFocus = (shouldDisable: boolean = true) => {
    useFocusEffect(
        useCallback(() => {
            if (shouldDisable) {
                stopDeviceConnectionListening();

                return () => {
                    restartDeviceConnectionListening();
                };
            }
        }, [shouldDisable]),
    );
};
