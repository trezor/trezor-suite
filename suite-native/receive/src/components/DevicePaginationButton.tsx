import { Pressable } from 'react-native';

import { NativeStyle, prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon, IconName } from '@suite-common/icons';
import { CSSColor, nativeBorders } from '@trezor/theme';
import { DeviceModelInternal } from '@trezor/connect';

import { DevicePaginationActivePage, PaginationCompatibleDeviceModel } from '../types';
import { DEVICE_SCREEN_BACKGROUND_COLOR, DEVICE_TEXT_COLOR } from '../constants';

type DeviceScreenPaginationProps = {
    activePage: DevicePaginationActivePage;
    deviceModel: PaginationCompatibleDeviceModel;
    isAddressRevealed: boolean;
    onPress: () => void;
};

const T2B1_BUTTON_COLOR = '#2B2D2B';
const BUTTON_HEIGHT = 56;
const BUTTON_WIDTH = 296;

const ICON_COLOR: CSSColor = DEVICE_TEXT_COLOR;

type DeviceButtonStyleProps = {
    deviceModel: PaginationCompatibleDeviceModel;
    isAddressRevealed: boolean;
};

const modelToStyles = {
    [DeviceModelInternal.T2T1]: {
        backgroundColor: T2B1_BUTTON_COLOR,
        borderRadius: nativeBorders.radii.small,
    },
    [DeviceModelInternal.T2B1]: {
        backgroundColor: DEVICE_SCREEN_BACKGROUND_COLOR,
        borderColor: DEVICE_TEXT_COLOR,
        borderRadius: nativeBorders.radii.large / 2,
        borderWidth: nativeBorders.widths.large,
    },
} as const satisfies Record<PaginationCompatibleDeviceModel, Readonly<NativeStyle>>;

const deviceButtonStyle = prepareNativeStyle<DeviceButtonStyleProps>(
    (_, { deviceModel, isAddressRevealed }) => ({
        height: BUTTON_HEIGHT,
        width: BUTTON_WIDTH,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 1,

        // apply model specific styles
        ...modelToStyles[deviceModel],

        extend: [
            // IF is the address not yet revealed, The button should be hidden,
            // but should still take the same proportion of the device screen.
            { condition: !isAddressRevealed, style: { opacity: 0 } },
        ],
    }),
);

export const DevicePaginationButton = ({
    activePage,
    deviceModel,
    isAddressRevealed,
    onPress,
}: DeviceScreenPaginationProps) => {
    const { applyStyle } = useNativeStyles();
    const chevronIcon: Extract<IconName, 'chevronDown' | 'chevronUp'> =
        activePage === 1 ? 'chevronDown' : 'chevronUp';

    return (
        <Pressable
            onPress={onPress}
            style={applyStyle(deviceButtonStyle, { deviceModel, isAddressRevealed })}
        >
            <Icon name={chevronIcon} color={ICON_COLOR} />
        </Pressable>
    );
};
