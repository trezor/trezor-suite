import { selectSelectedDevice } from '@suite-common/wallet-core';
import { Box, Column, Grid, Image } from '@trezor/components';
import { DeviceModelInternal, getDeviceColorVariant } from '@trezor/device-utils';
import {
    DeviceAnimation,
    DeviceWithScene,
    getLargeModelImagePath,
} from '@trezor/product-components';
import type { ModelFor } from '@trezor/product-components';
import { borders, spacings } from '@trezor/theme';

import { useLayoutSize, useSelector } from 'src/hooks/suite';

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
    const { isBelowTablet } = useLayoutSize();

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

        return <Image maxHeight={300} isFilterActive={false} image={image} />;
    };

    return (
        <Grid columns={isBelowTablet ? '1fr' : '260px 1fr'} gap={spacings.xl} width="100%">
            {model && (
                <Box hasBackground borderRadius={borders.radii.sm} padding={spacings.xxl}>
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
            <Column justifyContent="space-between">{children}</Column>
        </Grid>
    );
};
