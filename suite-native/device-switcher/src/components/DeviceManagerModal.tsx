import { Modal } from 'react-native';
import { ReactNode } from 'react';
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';

import { Box, ScreenHeaderWrapper } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { BlurredScreenOverlay } from '@suite-native/screen-overlay';

import { DeviceSwitch } from './DeviceSwitch';
import { useDeviceManager } from '../hooks/useDeviceManager';

type DeviceManagerModalProps = {
    children: ReactNode;
};

const contentWrapper = prepareNativeStyle<{ insets: EdgeInsets }>((utils, { insets }) => ({
    paddingTop: Math.max(insets.top, utils.spacings.medium),
    backgroundColor: utils.colors.backgroundSurfaceElevation0,
}));

export const DeviceManagerModal = ({ children }: DeviceManagerModalProps) => {
    const { applyStyle } = useNativeStyles();

    const insets = useSafeAreaInsets();

    const { setIsDeviceManagerVisible, isDeviceManagerVisible } = useDeviceManager();

    const handleClose = () => {
        setIsDeviceManagerVisible(false);
    };

    return (
        <Modal onRequestClose={handleClose} visible={isDeviceManagerVisible}>
            <BlurredScreenOverlay />
            <Box style={applyStyle(contentWrapper, { insets })}>
                <ScreenHeaderWrapper>
                    <Box flexDirection="row">
                        <DeviceSwitch />
                    </Box>
                </ScreenHeaderWrapper>
                {children}
            </Box>
        </Modal>
    );
};
