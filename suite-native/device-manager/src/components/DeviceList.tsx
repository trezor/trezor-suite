import { useSelector } from 'react-redux';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { View } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import {
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { analytics, EventType } from '@suite-native/analytics';
import {
    selectDevice,
    selectIsDeviceConnected,
    selectInstacelessUnselectedDevices,
    selectHasDeviceDiscovery,
} from '@suite-common/wallet-core';
import {
    Button,
    Box,
    TextDivider,
    VStack,
    ACCESSIBILITY_FONTSIZE_MULTIPLIER,
} from '@suite-native/atoms';
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

type ConnectButtonProps = {
    isDividerVisible: boolean;
    onPress: () => void;
};

const ANIMATION_DURATION = 300;

const DEVICE_LIST_TOP_MARGIN = 300; // This is so the bg is consistent even if the device list is dragged down while scrolling
const ITEM_HEIGHT = 66 * ACCESSIBILITY_FONTSIZE_MULTIPLIER;
const BUTTON_HEIGHT = 48 * ACCESSIBILITY_FONTSIZE_MULTIPLIER;
const BUTTON_PADDING_TOP = 8;
const PADDING_TOP = 12;
const PADDING_BOTTOM = 16;
const SEPARATOR_VERTICAL_PADDING = 4;
const SEPARATOR_HEIGHT = 26;

const buttonWrapperStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp16,
    paddingTop: utils.spacings.sp8,
}));

const ConnectButton = ({ isDividerVisible, onPress }: ConnectButtonProps) => {
    const { applyStyle } = useNativeStyles();

    return isDividerVisible ? (
        <VStack spacing="sp4" paddingTop="sp4">
            <TextDivider title="generic.orSeparator" />
            <Box style={applyStyle(buttonWrapperStyle)}>
                <Button colorScheme="tertiaryElevation0" onPress={onPress}>
                    <Translation id="deviceManager.connectButton.another" />
                </Button>
            </Box>
        </VStack>
    ) : (
        <Box style={applyStyle(buttonWrapperStyle)}>
            <Button colorScheme="tertiaryElevation0" onPress={onPress}>
                <Translation id="deviceManager.connectButton.first" />
            </Button>
        </Box>
    );
};

const listStaticStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderBottomLeftRadius: MANAGER_MODAL_BOTTOM_RADIUS,
    borderBottomRightRadius: MANAGER_MODAL_BOTTOM_RADIUS,
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors.borderElevation0,
    marginBottom: -MANAGER_MODAL_BOTTOM_RADIUS,
    marginTop: -MANAGER_MODAL_BOTTOM_RADIUS - DEVICE_LIST_TOP_MARGIN,
    paddingTop: MANAGER_MODAL_BOTTOM_RADIUS + PADDING_TOP + DEVICE_LIST_TOP_MARGIN,
    paddingBottom: PADDING_BOTTOM,
    overflow: 'hidden',
    flexGrow: 0,
    zIndex: 10,
    ...utils.boxShadows.small,
}));

const calculateHeight = (deviceCount: number, isConnectButtonVisible: boolean) => {
    'worklet';

    const otherDevicesHeight = deviceCount * ITEM_HEIGHT;

    const separatorHeight =
        deviceCount > 0 && isConnectButtonVisible
            ? 2 * SEPARATOR_VERTICAL_PADDING + SEPARATOR_HEIGHT
            : 0;

    const buttonHeight = isConnectButtonVisible ? BUTTON_PADDING_TOP + BUTTON_HEIGHT : 0;

    const h =
        MANAGER_MODAL_BOTTOM_RADIUS + //top margin for radius
        PADDING_TOP +
        otherDevicesHeight + // all other device
        separatorHeight + // separator if there is one
        buttonHeight +
        PADDING_BOTTOM -
        MANAGER_MODAL_BOTTOM_RADIUS;

    return h;
};

export const DeviceList = ({ isVisible, onSelectDevice }: DeviceListProps) => {
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation<NavigationProp>();
    const { setIsDeviceManagerVisible } = useDeviceManager();
    const device = useSelector(selectDevice);
    const notSelectedInstancelessDevices = useSelector(selectInstacelessUnselectedDevices);
    const hasDiscovery = useSelector(selectHasDeviceDiscovery);
    const isDeviceConnected = useSelector(selectIsDeviceConnected);
    const opacity = useSharedValue(0);
    const height = useSharedValue(0);

    const hasUnselectedDevices = notSelectedInstancelessDevices.length > 0;
    const isConnectButtonVisible = !hasDiscovery && !isDeviceConnected;

    const handleConnectDevice = () => {
        if (device) {
            onSelectDevice(device);
        }
        setIsDeviceManagerVisible(false);
        navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
            screen: AuthorizeDeviceStackRoutes.ConnectAndUnlockDevice,
        });
        analytics.report({
            type: EventType.DeviceManagerClick,
            payload: { action: 'connectDeviceButton' },
        });
    };

    const listAnimatedStyle = useAnimatedStyle(() => {
        const h = calculateHeight(notSelectedInstancelessDevices.length, isConnectButtonVisible);

        height.value = isVisible ? h : 0;
        opacity.value = isVisible ? 1 : 0;

        return {
            opacity: withTiming(opacity.value, { duration: ANIMATION_DURATION }),
            height: withTiming(height.value, { duration: ANIMATION_DURATION }),
        };
    }, [isVisible, isConnectButtonVisible]);

    return (
        <Animated.View style={listAnimatedStyle}>
            <View style={applyStyle(listStaticStyle)}>
                <Box>
                    {notSelectedInstancelessDevices.map(
                        d =>
                            d.state && (
                                <DeviceItem
                                    key={d.state}
                                    deviceState={d.state}
                                    onPress={() => onSelectDevice(d)}
                                />
                            ),
                    )}
                </Box>
                {isConnectButtonVisible && (
                    <ConnectButton
                        isDividerVisible={hasUnselectedDevices}
                        onPress={handleConnectDevice}
                    />
                )}
            </View>
        </Animated.View>
    );
};
