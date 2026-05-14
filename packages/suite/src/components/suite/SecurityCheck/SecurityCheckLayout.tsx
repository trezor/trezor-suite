import { selectSelectedDevice } from '@suite-common/device';
import { Box, Column, Image } from '@trezor/components';
import { DeviceModelInternal, getDeviceColorVariant } from '@trezor/device-utils';
import type { ModelFor } from '@trezor/product-components';
import {
    DeviceAnimation,
    DeviceWithScene,
    getLargeModelImagePath,
} from '@trezor/product-components';
import { borders, breakpoints } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
import { ContentFlex } from 'src/support/suite/ContentFlex';

type SecurityCheckLayoutProps = {
    isFailed?: boolean;
    children: React.ReactNode;
    imageMode?: 'ROTATE' | 'STATIC';
};

type RotateModel = Extract<DeviceModelInternal, ModelFor<'ROTATE'>>;

const isModelWithRotate = (model: DeviceModelInternal | undefined): model is RotateModel =>
    !!model && model !== DeviceModelInternal.UNKNOWN;

const getDeviceModel = (deviceModelInternal: DeviceModelInternal | undefined): RotateModel =>
    isModelWithRotate(deviceModelInternal)
        ? deviceModelInternal
        : (DeviceModelInternal.T3W1 as RotateModel);

export const SecurityCheckLayout = ({
    isFailed,
    children,
    imageMode,
}: SecurityCheckLayoutProps) => {
    const device = useSelector(selectSelectedDevice);
    const model = getDeviceModel(device?.features?.internal_model);
    const isDeviceImageRotating = imageMode === 'ROTATE';
    const deviceUnitColor = getDeviceColorVariant(device);
    const image = getLargeModelImagePath(model, deviceUnitColor);

    const getDeviceImage = () => {
        if (isFailed) {
            return (
                <DeviceWithScene
                    deviceModel={model}
                    scene="ghost"
                    width={150}
                    unitColor={device?.features?.unit_color}
                />
            );
        }

        return <Image maxHeight={300} image={image} />;
    };

    return (
        <ContentFlex breakpoint={breakpoints.tablet} gap={24} alignItems="center" width="100%">
            {model && (
                <Box
                    backgroundColor="surfaceFillRaised"
                    borderRadius={borders.radii.sm}
                    padding={32}
                    width="100%"
                    maxWidth={260}
                >
                    <Column height="100%" justifyContent="center" alignItems="center">
                        {isDeviceImageRotating ? (
                            <DeviceAnimation
                                type="ROTATE"
                                deviceModelInternal={model}
                                deviceUnitColor={deviceUnitColor as any}
                                height={300}
                                sizeVariant="LARGE"
                            />
                        ) : (
                            getDeviceImage()
                        )}
                    </Column>
                </Box>
            )}
            <Column justifyContent="space-between" flex="1" width="100%" overflow="hidden">
                {children}
            </Column>
        </ContentFlex>
    );
};
