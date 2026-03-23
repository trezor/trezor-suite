import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';

import { deviceActions } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { selectIsDeviceAutoEjectEnabled } from '@suite-common/wallet-core';
import { IconButton } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useToast } from '@suite-native/toasts';

export const WalletRememberModeIconButton = ({ device }: { device: TrezorDevice }) => {
    const dispatch = useDispatch();

    const isDeviceAutoEjectEnabled = useSelector(selectIsDeviceAutoEjectEnabled);

    const { showToast } = useToast();

    const handleEjectWallet = () => {
        if (device.connected) {
            dispatch(deviceActions.setRememberDevice({ device, remember: !device.remember }));
            if (device.remember) {
                showToast({
                    variant: 'default',
                    message: (
                        <Translation id="moduleSettings.viewOnly.autoEject.toast.walletsWillBeEjected" />
                    ),
                });
            }
        } else {
            dispatch(deviceActions.forgetDevice({ device }));
            showToast({
                variant: 'default',
                message: <Translation id="moduleSettings.viewOnly.autoEject.toast.walletEjected" />,
            });
        }
    };

    if (isDeviceAutoEjectEnabled) return null;

    return (
        <Animated.View entering={FadeIn} exiting={FadeOut}>
            <IconButton
                iconName={device.remember ? 'ejectSimple' : 'arrowUUpLeft'}
                onPress={handleEjectWallet}
                colorScheme="tertiaryElevation1"
                size="extraSmall"
                testID="@settings/eject-single-wallet"
            />
        </Animated.View>
    );
};
