import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import TrezorConnect, { DeviceModelInternal } from '@trezor/connect';
import {
    ConnectDeviceStackParamList,
    ConnectDeviceStackRoutes,
    RootStackParamList,
    StackToTabCompositeProps,
} from '@suite-native/navigation';
import { Box, IconButton, ScreenHeaderWrapper } from '@suite-native/atoms';
import { selectDevice, selectDeviceModel, removeButtonRequests } from '@suite-common/wallet-core';

import { ConnectingTrezorHelp } from './ConnectingTrezorHelp';

type ConnectDeviceScreenHeaderProps = {
    shouldDisplayCancelButton?: boolean;
};

type NavigationProp = StackToTabCompositeProps<
    ConnectDeviceStackParamList,
    ConnectDeviceStackRoutes.ConnectingDevice,
    RootStackParamList
>;

export const ConnectDeviceScreenHeader = ({
    shouldDisplayCancelButton = true,
}: ConnectDeviceScreenHeaderProps) => {
    const navigation = useNavigation<NavigationProp>();
    const dispatch = useDispatch();

    const device = useSelector(selectDevice);
    const deviceModel = useSelector(selectDeviceModel);

    const handleCancel = () => {
        TrezorConnect.cancel('pin-cancelled');
        dispatch(
            removeButtonRequests({
                device,
                buttonRequestCode:
                    deviceModel === DeviceModelInternal.T1B1
                        ? 'PinMatrixRequestType_Current'
                        : 'ButtonRequest_PinEntry',
            }),
        );

        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    };

    return (
        <ScreenHeaderWrapper>
            <Box>
                {shouldDisplayCancelButton && (
                    <IconButton
                        iconName="close"
                        size="medium"
                        colorScheme="tertiaryElevation1"
                        accessibilityRole="button"
                        accessibilityLabel="close"
                        onPress={handleCancel}
                    />
                )}
            </Box>
            <ConnectingTrezorHelp />
        </ScreenHeaderWrapper>
    );
};
