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
import { useTranslate } from '@suite-native/intl';

import { DeviceScreenPagination } from './DeviceScreenPagination';
import { DEVICE_SCREEN_BACKGROUND_COLOR, DEVICE_TEXT_COLOR } from '../../constants';
import { parseAddressToDeviceLines } from '../../utils';
import { DevicePaginationActivePage, isPaginationCompatibleDeviceModel } from '../../types';
import { ReceiveProgressStep, isAddressRevealed } from '../../hooks/useReceiveProgressSteps';
import { DeviceScreenLoading } from './DeviceScreenLoading';

type DeviceScreenContentProps = {
    address: string;
    isPaginationEnabled: boolean;
    activePage: DevicePaginationActivePage;
    receiveProgressStep: ReceiveProgressStep;
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
        fontSource: require('@trezor/theme/fonts/PixelOperatorMono8-Regular.ttf'),
        fontSize: 14,
        lineWidth: 295,
        lineHeight: 17,
        pagerOffset: 0,
    },
    [DeviceModelInternal.T2T1]: {
        fontSource: require('@trezor/theme/fonts/RobotoMono-Regular.ttf'),
        fontSize: 20,
        lineWidth: 230,
        lineHeight: 25,
        pagerOffset: 60,
    },
    [DeviceModelInternal.T2B1]: {
        fontSource: require('@trezor/theme/fonts/PixelOperatorMono8-Regular.ttf'),
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
    isLoading: boolean;
};

const contentCanvasStyle = prepareNativeStyle<ContentCanvasStyleProps>(
    (_, { lineWidth, lineHeight, isPaginationEnabled, numberOfLines, pagerOffset, isLoading }) => ({
        width: lineWidth,
        height: lineHeight * numberOfLines,
        extend: [
            {
                condition: isPaginationEnabled,
                style: {
                    // IF pagination is enabled, the content canvas should be 4 lines high
                    // so the content of the screen does not jump while switching pages.
                    height: lineHeight * (4 + (isLoading ? 1 : 0)),
                    width: lineWidth + pagerOffset,
                },
            },
        ],
    }),
);

export const DeviceScreenContent = ({
    address,
    isPaginationEnabled,
    activePage,
    receiveProgressStep,
}: DeviceScreenContentProps) => {
    const { applyStyle } = useNativeStyles();
    const deviceModel = useSelector(selectDeviceModel);
    const { translate } = useTranslate();

    const { fontSource, fontSize, lineWidth, lineHeight, pagerOffset } =
        deviceToContentStyles[deviceModel ?? 'T1B1'];
    const deviceFont = useFont(fontSource, fontSize);

    const isLoading = receiveProgressStep === ReceiveProgressStep.LoadingOnTrezor;

    const isConfirmOnTrezorReady =
        receiveProgressStep === ReceiveProgressStep.ShownUncheckedAddress;

    const isAddressShown = isAddressRevealed(receiveProgressStep);

    if (!deviceModel) return null;

    const bchPrefixRemovedAddress = address.replace('bitcoincash:', '');

    const addressLines = parseAddressToDeviceLines({
        address: bchPrefixRemovedAddress,
        deviceModel,
        isPaginationEnabled,
        activePage,
    });

    const isPaginationDisplayed =
        isPaginationEnabled && isPaginationCompatibleDeviceModel(deviceModel);

    const lines = addressLines.length + (isLoading ? 1 : 0);

    return (
        <Canvas
            style={applyStyle(contentCanvasStyle, {
                lineWidth,
                lineHeight,
                isPaginationEnabled,
                pagerOffset,
                numberOfLines: lines,
                isLoading,
            })}
        >
            <Group>
                {addressLines.map((line, index) => {
                    const isTrimmedContent = !isAddressShown && !isConfirmOnTrezorReady;
                    // hide all lines following the one with fade out gradient.
                    if (isTrimmedContent && index > 1) return null;

                    const isLineFaded = isTrimmedContent && index === 1;
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
                        isPaginationShown={isAddressShown}
                    />
                )}
                <DeviceScreenLoading
                    isLoading={isLoading}
                    font={deviceFont}
                    xOffset={lineWidth * 0.3}
                    yOffset={(lines - 1 + 0.75) * lineHeight}
                    text={translate('moduleReceive.receiveAddressCard.showAddress.loading')}
                />
            </Group>
        </Canvas>
    );
};
