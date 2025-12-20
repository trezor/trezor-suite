import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/wallet-core';
import { Box } from '@suite-native/atoms';
import {
    ContinueOnTrezorScreenContent,
    selectShouldFactoryResetBeVisible,
} from '@suite-native/device';
import { Screen, ScreenHeader, useInterceptNativeNavigation } from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';

export const WipeDeviceContinueOnTrezorScreen = () => {
    const shouldFactoryResetBeVisible = useSelector(selectShouldFactoryResetBeVisible);

    useInterceptNativeNavigation({ onPress: TrezorConnect.cancel });

    const device = useSelector(selectSelectedDevice);

    const closeAction = useCallback(() => {
        TrezorConnect.cancel();
    }, []);

    if (!device) {
        return null;
    }

    return (
        // In bootloader mode, TrezorConnect.cancel() won't do anything, so we don't want to display header with close action.
        <Screen
            header={
                !shouldFactoryResetBeVisible && (
                    <ScreenHeader closeAction={closeAction} closeActionType="close" />
                )
            }
            hasBottomInset={false}
            isScrollable={false}
        >
            <Box marginTop="sp8" flex={1}>
                <ContinueOnTrezorScreenContent />
            </Box>
        </Screen>
    );
};
