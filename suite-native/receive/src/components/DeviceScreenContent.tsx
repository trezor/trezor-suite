import { useSelector } from 'react-redux';

import {
    Canvas,
    Group,
    Text as SkiaText,
    LinearGradient,
    useFont,
    vec,
} from '@shopify/react-native-skia';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { DeviceModelInternal } from '@trezor/connect';
import { selectDeviceModel } from '@suite-common/wallet-core';

import { DeviceScreenPagination } from './DeviceScreenPagination';
import { DEVICE_SCREEN_BACKGROUND_COLOR, DEVICE_TEXT_COLOR } from '../constants';
import { parseAddressToDeviceLines } from '../utils';
import { DevicePaginationActivePage, isPaginationCompatibleDeviceModel } from '../types';

type DeviceScreenContentProps = {
    address: string;
    isAddressRevealed: boolean;
    isPaginationEnabled: boolean;
    activePage: DevicePaginationActivePage;
};

type DeviceModelLayoutProps = {
    fontSource: string;
    fontSize: number;
    lineWidth: number;
    lineHeight: number;
    pagerOffset: number;
};

const deviceToContentStyles = {
    [DeviceModelInternal.T1B1]: {
        fontSource: require('../../../../packages/theme/fonts/PixelOperatorMono8-Regular.ttf'),
        fontSize: 14,
        lineWidth: 295,
        lineHeight: 17,
        pagerOffset: 0,
    },
    [DeviceModelInternal.T2T1]: {
        fontSource: require('../../../../packages/theme/fonts/RobotoMono-Regular.ttf'),
        fontSize: 20,
        lineWidth: 215,
        lineHeight: 25,
        pagerOffset: 60,
    },
    [DeviceModelInternal.T2B1]: {
        fontSource: require('../../../../packages/theme/fonts/PixelOperatorMono8-Regular.ttf'),
        fontSize: 14,
        lineWidth: 265,
        lineHeight: 25,
        pagerOffset: 40,
    },
} as const satisfies Record<DeviceModelInternal, DeviceModelLayoutProps>;

type ContentCanvasStyleProps = {
    lineWidth: number;
    lineHeight: number;
    numberOfLines: number;
    isPaginationEnabled: boolean;
    pagerOffset: number;
};

const contentCanvasStyle = prepareNativeStyle<ContentCanvasStyleProps>(
    (_, { lineWidth, lineHeight, isPaginationEnabled, numberOfLines, pagerOffset }) => ({
        width: lineWidth,
        height: lineHeight * numberOfLines,

        extend: [
            {
                condition: isPaginationEnabled,
                style: {
                    // IF pagination is enabled, the content canvas should be 4 lines high
                    // so the content of the screen does not jump while switching pages.
                    height: lineHeight * 4,
                    width: lineWidth + pagerOffset,
                },
            },
        ],
    }),
);

export const DeviceScreenContent = ({
    address,
    isAddressRevealed,
    isPaginationEnabled,
    activePage,
}: DeviceScreenContentProps) => {
    const { applyStyle } = useNativeStyles();
    const deviceModel = useSelector(selectDeviceModel);
    const { fontSource, fontSize, lineWidth, lineHeight, pagerOffset } =
        deviceToContentStyles[deviceModel ?? 'T1B1'];

    const deviceFont = useFont(fontSource, fontSize);

    if (!deviceModel) return null;

    const addressLines = parseAddressToDeviceLines({
        address,
        deviceModel,
        isPaginationEnabled,
        activePage,
    });

    const isPaginationDisplayed =
        isPaginationEnabled && isPaginationCompatibleDeviceModel(deviceModel);

    return (
        <Canvas
            style={applyStyle(contentCanvasStyle, {
                lineWidth,
                lineHeight,
                isPaginationEnabled,
                pagerOffset,
                numberOfLines: addressLines.length,
            })}
        >
            <Group>
                {addressLines.map((line, index) => {
                    // hide all lines following the one with fade out gradient.
                    if (!isAddressRevealed && index > 1) return null;

                    const isLineFaded = !isAddressRevealed && index === 1;
                    const gradientCenterX = lineWidth / 2;
                    const gradientEndY = lineHeight / 0.5;

                    return (
                        <SkiaText
                            key={line}
                            x={0}
                            y={(index + 0.75) * lineHeight}
                            text={line}
                            font={deviceFont}
                            color={DEVICE_TEXT_COLOR}
                        >
                            <LinearGradient
                                start={vec(gradientCenterX, 0)}
                                end={vec(gradientCenterX, gradientEndY)}
                                colors={[
                                    DEVICE_TEXT_COLOR,
                                    isLineFaded
                                        ? DEVICE_SCREEN_BACKGROUND_COLOR
                                        : DEVICE_TEXT_COLOR,
                                ]}
                            />
                        </SkiaText>
                    );
                })}
                {isPaginationDisplayed && (
                    <DeviceScreenPagination
                        deviceModel={deviceModel}
                        activePage={activePage}
                        isAddressRevealed={isAddressRevealed}
                    />
                )}
            </Group>
        </Canvas>
    );
};
