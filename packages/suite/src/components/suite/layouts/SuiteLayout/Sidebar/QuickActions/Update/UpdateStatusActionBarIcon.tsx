import styled, { css, DefaultTheme, useTheme } from 'styled-components';
import { useDevice } from '../../../../../../../hooks/suite';
import { ComponentWithSubIcon, getIconSize, Icon, IconSize, iconSizes } from '@trezor/components';
import { QuickActionButton } from '../QuickActionButton';
import { UpdateIconGroup } from './UpdateIconGroup';
import { borders, Color, CSSColor } from '@trezor/theme';
import { useUpdateStatus } from './useUpdateStatus';
import { UpdateTooltip } from './UpdateTooltip';
import {
    mapDeviceUpdateToClick,
    mapSuiteUpdateToClick,
    mapUpdateStatusToIcon,
    mapUpdateStatusToVariant,
    UpdateStatus,
    UpdateVariant,
} from './updateQuickActionTypes';
import { isDesktop } from '@trezor/env-utils';
import { useDispatch } from 'react-redux';
import { mapTrezorModelToIcon } from '@trezor/product-components';
import { UpdateNotificationBanner } from './UpdateNotificationBanner';
import { useState } from 'react';

type MapArgs = {
    $variant: UpdateVariant;
    theme: DefaultTheme;
};

export const mapVariantToIconColor = ({ $variant, theme }: MapArgs): CSSColor => {
    const colorMap: Record<UpdateVariant, Color> = {
        info: 'iconAlertBlue',
        purple: 'iconAlertPurple',
        tertiary: 'iconSubdued',
    };

    return theme[colorMap[$variant]];
};

type HighlightedProps = { $isHighlighted: boolean };

const highlighted = css<HighlightedProps>`
    ${({ $isHighlighted }) =>
        $isHighlighted
            ? ''
            : css`
                  opacity: 50%;
              `}
`;

const Highlighted = styled.div<HighlightedProps>`
    ${highlighted}
`;

type SuiteIconRectangle = {
    $variant: UpdateVariant;
    $isHighlighted: boolean;
    $size: IconSize;
};

const SuiteIconRectangle = styled.div<SuiteIconRectangle>`
    display: flex;
    align-items: center;
    justify-content: center;
    padding-left: 0.5px;
    width: ${({ $size }) => getIconSize($size)}px;
    height: ${({ $size }) => getIconSize($size)}px;

    border-radius: ${borders.radii.xxs};
    background-color: ${({ $variant, theme }) => mapVariantToIconColor({ $variant, theme })};

    ${highlighted}
`;

const Relative = styled.div<{ $size: IconSize }>`
    position: relative;
    width: ${({ $size }) => getIconSize($size)}px;
    height: ${({ $size }) => getIconSize($size)}px;
`;

type UsbCableForTrezorIcon = {
    $variant: UpdateVariant;
    $size: IconSize;
};

const UsbCableForTrezorIcon = styled.div<UsbCableForTrezorIcon>`
    width: 2px;
    height: 5px;

    position: absolute;
    bottom: -4px;
    left: ${({ $size }) => getIconSize($size) / 2 - 1}px;

    background-color: ${({ $variant, theme }) => mapVariantToIconColor({ $variant, theme })};
`;

type DeviceUpdateIconProps = {
    iconSize: IconSize;
    updateStatus: UpdateStatus;
    variant: UpdateVariant;
};

const DeviceUpdateIcon = ({ iconSize, updateStatus, variant }: DeviceUpdateIconProps) => {
    const { device } = useDevice();

    if (device?.features === undefined) {
        return null;
    }

    return (
        <Highlighted $isHighlighted={updateStatus !== 'up-to-date'}>
            <Relative $size={iconSize}>
                <Icon
                    name={mapTrezorModelToIcon[device.features.internal_model]}
                    size={iconSizes.medium}
                    variant={variant}
                />
                <UsbCableForTrezorIcon $variant={variant} $size={iconSize} />
            </Relative>
        </Highlighted>
    );
};

type SuiteUpdateIconProps = {
    iconSize: IconSize;
    updateStatus: UpdateStatus;
    variant: UpdateVariant;
};

const SuiteUpdateIcon = ({ iconSize, updateStatus, variant }: SuiteUpdateIconProps) => {
    const theme = useTheme();

    return (
        <SuiteIconRectangle
            $variant={variant}
            $isHighlighted={updateStatus !== 'up-to-date'}
            $size={iconSize}
        >
            <Highlighted $isHighlighted={updateStatus !== 'up-to-date'}>
                <Icon name="trezor" size={iconSizes.small} color={theme['iconDefaultInverted']} />
            </Highlighted>
        </SuiteIconRectangle>
    );
};

export const UpdateStatusActionBarIcon = () => {
    const theme = useTheme();
    const [closedNotificationDevice, setClosedNotificationDevice] = useState(false);
    const [closedNotificationSuite, setClosedNotificationSuite] = useState(false);

    const { updateStatus, updateStatusDevice, updateStatusSuite } = useUpdateStatus();
    const { device } = useDevice();
    const dispatch = useDispatch();

    const updateSubIcon = mapUpdateStatusToIcon[updateStatus];
    const variant = mapUpdateStatusToVariant[updateStatus];
    const iconSize: IconSize = 'medium';

    const isDesktopSuite = isDesktop();

    if (device?.features === undefined) {
        return null;
    }

    const handleOnClick = () => {
        if (updateStatusSuite !== 'up-to-date') {
            mapSuiteUpdateToClick[updateStatusSuite]?.({ dispatch });
        } else if (updateStatusDevice !== 'up-to-date') {
            mapDeviceUpdateToClick[updateStatusDevice]?.({ dispatch });
        }
    };

    const showBannerNotification =
        (updateStatusSuite !== 'up-to-date' && !closedNotificationSuite) ||
        (updateStatusDevice !== 'up-to-date' && !closedNotificationDevice);

    const onNotificationBannerClosed = () => {
        if (updateStatusSuite !== 'up-to-date') {
            setClosedNotificationSuite(true);
        }
        if (updateStatusDevice !== 'up-to-date') {
            setClosedNotificationDevice(true);
        }
    };

    return (
        <div>
            {showBannerNotification && (
                <UpdateNotificationBanner
                    updateStatusDevice={updateStatusDevice}
                    updateStatusSuite={updateStatusSuite}
                    onClose={onNotificationBannerClosed}
                />
            )}
            <QuickActionButton
                tooltip={
                    !showBannerNotification && (
                        <UpdateTooltip
                            updateStatusDevice={updateStatusDevice}
                            updateStatusSuite={updateStatusSuite}
                        />
                    )
                }
                onClick={handleOnClick}
            >
                <ComponentWithSubIcon
                    variant={variant}
                    subIconProps={{
                        name: updateSubIcon,
                        color: theme.iconDefaultInverted,
                        size: iconSizes.extraSmall,
                    }}
                >
                    <UpdateIconGroup $variant={variant}>
                        <DeviceUpdateIcon
                            iconSize={iconSize}
                            updateStatus={updateStatusDevice}
                            variant={variant}
                        />
                        {isDesktopSuite && (
                            <SuiteUpdateIcon
                                iconSize={iconSize}
                                updateStatus={updateStatusDevice}
                                variant={variant}
                            />
                        )}
                    </UpdateIconGroup>
                </ComponentWithSubIcon>
            </QuickActionButton>
        </div>
    );
};
