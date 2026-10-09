import { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { deviceActions } from '@suite-common/device';
import { injectDispatch } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';
import { selectIsDeviceAutoEjectEnabled } from '@suite-common/wallet-core';
import { AnimatedView, IconButton } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useToast } from '@suite-native/toasts';
import { useServices } from '@trezor/dependency-injection';

export const WalletRememberModeIconButton = ({ device }: { device: TrezorDevice }) => {
    const { dispatch } = useServices(injectDispatch);

    const isDeviceAutoEjectEnabled = useSelector(selectIsDeviceAutoEjectEnabled);

    const { showToast } = useToast();

    const handleEjectWallet = () => {
        if (device.connected) {
            dispatch(deviceActions.setRememberDevice({ device, remember: !device.remember }));
            if (device.remember) {
                showToast({
                    intent: 'neutral',
                    message: (
                        <Translation id="moduleSettings.viewOnly.autoEject.toast.walletsWillBeEjected" />
                    ),
                });
            }
        } else {
            dispatch(deviceActions.forgetDevice({ device }));
            showToast({
                intent: 'neutral',
                message: <Translation id="moduleSettings.viewOnly.autoEject.toast.walletEjected" />,
            });
        }
    };

    if (isDeviceAutoEjectEnabled) return null;

    return (
        <AnimatedView entering={FadeIn} exiting={FadeOut}>
            <IconButton
                iconName={device.remember ? 'ejectSimple' : 'arrowUUpLeft'}
                onPress={handleEjectWallet}
                intent="neutral"
                priority="secondary"
                testID="@settings/eject-single-wallet"
            />
        </AnimatedView>
    );
};
