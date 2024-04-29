import { useSelector } from 'react-redux';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';
import { useEffect, useState } from 'react';

import { useNavigation } from '@react-navigation/native';
import { A } from '@mobily/ts-belt';

import {
    ConnectDeviceStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { analytics, EventType } from '@suite-native/analytics';
import { selectDevice, selectInstacelessUnselectedDevices } from '@suite-common/wallet-core';
import { Button, VStack, Box, TextDivider } from '@suite-native/atoms';
import { TrezorDevice } from '@suite-common/suite-types';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { DeviceItem } from './DeviceItem/DeviceItem';
import { useDeviceManager } from '../hooks/useDeviceManager';
import { MANAGER_MODAL_BOTTOM_RADIUS } from './DeviceManagerModal';

type NavigationProp = StackToStackCompositeNavigationProps<
    RootStackParamList,
    RootStackRoutes.AppTabs,
    RootStackParamList
>;

type DeviceListProps = {
    isVisible: boolean;
    onSelectDevice: (device: TrezorDevice) => void;
};

const ITEM_HEIGHT = 66;
const BUTTON_HEIGHT = 48;
const VERTICAL_PADDING = 16;
const SEPARATOR_VERTICAL_PADDING = 4;
const SEPARATOR_HEIGHT = 26;
const TOP_LIST_PADDING = 12;

const buttonWrapperStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.medium,
}));

const listStaticStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderBottomLeftRadius: MANAGER_MODAL_BOTTOM_RADIUS,
    borderBottomRightRadius: MANAGER_MODAL_BOTTOM_RADIUS,
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors.borderElevation0,
    marginTop: -MANAGER_MODAL_BOTTOM_RADIUS,
    marginBottom: -MANAGER_MODAL_BOTTOM_RADIUS,
    paddingTop: MANAGER_MODAL_BOTTOM_RADIUS + TOP_LIST_PADDING,
    paddingBottom: VERTICAL_PADDING,
    zIndex: 10,
    ...utils.boxShadows.small,
}));

export const DeviceList = ({ isVisible, onSelectDevice }: DeviceListProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const navigation = useNavigation<NavigationProp>();
    const { setIsDeviceManagerVisible } = useDeviceManager();
    const device = useSelector(selectDevice);
    const notSelectedInstancelessDevices = useSelector(selectInstacelessUnselectedDevices);
    const opacity = useSharedValue(0);
    const height = useSharedValue(0);
    const [isShown, setIsShown] = useState(false);

    const handleConnectDevice = () => {
        if (device) {
            onSelectDevice(device);
        }
        setIsDeviceManagerVisible(false);
        navigation.navigate(RootStackRoutes.ConnectDeviceStack, {
            screen: ConnectDeviceStackRoutes.ConnectAndUnlockDevice,
        });
        analytics.report({
            type: EventType.DeviceManagerClick,
            payload: { action: 'connectDeviceButton' },
        });
    };

    //to hide/show the list with animation
    useEffect(() => {
        if (isVisible) {
            const hasNotSelectedInstancelessDevices = notSelectedInstancelessDevices.length > 0;

            const paddingsHeight = VERTICAL_PADDING * 2;

            const otherDevicesHeight = notSelectedInstancelessDevices.length * ITEM_HEIGHT;

            const separatorHeight = hasNotSelectedInstancelessDevices ? SEPARATOR_HEIGHT : 0;

            const separatorPaddding = hasNotSelectedInstancelessDevices
                ? SEPARATOR_VERTICAL_PADDING * 2
                : 0;

            const radiusesHeight = MANAGER_MODAL_BOTTOM_RADIUS * 2;

            const h =
                otherDevicesHeight +
                radiusesHeight +
                separatorHeight +
                separatorPaddding +
                BUTTON_HEIGHT +
                paddingsHeight;

            opacity.value = withDelay(100, withTiming(1, { duration: 200 }));
            height.value = withTiming(h, { duration: 300 });

            setIsShown(true);
        } else {
            opacity.value = withTiming(0, { duration: 300 });
            height.value = withDelay(
                100,
                withTiming(0, { duration: 200 }, () => {
                    runOnJS(setIsShown)(false);
                }),
            );
        }
    }, [height, isVisible, opacity, notSelectedInstancelessDevices.length, utils.spacings.small]);

    const listAnimatedStyle = useAnimatedStyle(
        () => ({
            opacity: opacity.value,
            height: height.value,
        }),
        [],
    );

    if (!isShown) {
        return null;
    }

    return (
        <Animated.View style={[listAnimatedStyle, applyStyle(listStaticStyle)]}>
            <VStack>
                <Box>
                    {notSelectedInstancelessDevices.map(d => {
                        if (d.state === undefined) {
                            return null;
                        }

                        return (
                            <DeviceItem
                                key={d.state}
                                deviceState={d.state}
                                onPress={() => onSelectDevice(d)}
                            />
                        );
                    })}
                </Box>

                {A.isEmpty(notSelectedInstancelessDevices) ? (
                    <Box style={applyStyle(buttonWrapperStyle)}>
                        <Button colorScheme="tertiaryElevation1" onPress={handleConnectDevice}>
                            <Translation id="deviceManager.connectButton.first" />
                        </Button>
                    </Box>
                ) : (
                    <>
                        <TextDivider title="generic.orSeparator" />
                        <Box style={applyStyle(buttonWrapperStyle)}>
                            <Button colorScheme="tertiaryElevation1" onPress={handleConnectDevice}>
                                <Translation id="deviceManager.connectButton.another" />
                            </Button>
                        </Box>
                    </>
                )}
            </VStack>
        </Animated.View>
    );
};
