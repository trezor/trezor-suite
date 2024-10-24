import { Pressable } from 'react-native';

import { NativeStyle, prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon, IconName } from '@suite-native/icons';
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

const BUTTON_HEIGHT = 56;
const BUTTON_WIDTH = 296;

const ICON_COLOR: CSSColor = DEVICE_TEXT_COLOR;

type DeviceButtonStyleProps = {
    deviceModel: PaginationCompatibleDeviceModel;
    isAddressRevealed: boolean;
};

const safe3Styles = {
    backgroundColor: DEVICE_SCREEN_BACKGROUND_COLOR,
    borderColor: DEVICE_TEXT_COLOR,
    borderRadius: nativeBorders.radii.r12,
    borderWidth: nativeBorders.widths.large,
} as const;

const touchscreenDeviceStyles = {
    backgroundColor: '#2B2D2B',
    borderRadius: nativeBorders.radii.r8,
} as const;

const modelToStyles = {
    [DeviceModelInternal.T2T1]: touchscreenDeviceStyles,
    [DeviceModelInternal.T2B1]: safe3Styles,
    [DeviceModelInternal.T3B1]: safe3Styles,
    [DeviceModelInternal.T3T1]: touchscreenDeviceStyles,
    [DeviceModelInternal.T3W1]: touchscreenDeviceStyles, // TODO T3W1
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
    const chevronIcon: Extract<IconName, 'caretDown' | 'caretUp'> =
        activePage === 1 ? 'caretDown' : 'caretUp';

    return (
        <Pressable
            onPress={onPress}
            style={applyStyle(deviceButtonStyle, { deviceModel, isAddressRevealed })}
        >
            <Icon name={chevronIcon} color={ICON_COLOR} />
        </Pressable>
    );
};
