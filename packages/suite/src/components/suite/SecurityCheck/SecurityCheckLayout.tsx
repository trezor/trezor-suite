import { selectSelectedDevice } from '@suite-common/wallet-core';
import { Box, Column, Grid, Image } from '@trezor/components';
import {
    DeviceAnimation,
    DeviceWithScene,
    getLargeModelImagePath,
} from '@trezor/product-components';
import { borders, spacings } from '@trezor/theme';

import { useLayoutSize, useSelector } from 'src/hooks/suite';

type SecurityCheckLayoutProps = {
    isFailed?: boolean;
    children: React.ReactNode;
    imageMode?: 'ROTATE' | 'STATIC';
};

export const SecurityCheckLayout = ({
    isFailed,
    children,
    imageMode,
}: SecurityCheckLayoutProps) => {
    const device = useSelector(selectSelectedDevice);
    const { isBelowTablet } = useLayoutSize();

    const deviceModelInternal = device?.features?.internal_model;
    const isDeviceImageRotating = imageMode === 'ROTATE' && deviceModelInternal;

    const deviceUnitColor = device?.features?.unit_color;

    const image = getLargeModelImagePath(deviceModelInternal, deviceUnitColor);

    const getDeviceImage = () => {
        if (isFailed) {
            return (
                <DeviceWithScene
                    deviceModel={deviceModelInternal!}
                    scene="ghost"
                    width={200}
                    unitColor={device?.features?.unit_color}
                />
            );
        }

        return <Image maxHeight={300} isFilterActive={false} image={image} />;
    };

    return (
        <Grid columns={isBelowTablet ? '1fr' : '260px 1fr'} gap={spacings.xl} width="100%">
            {deviceModelInternal && (
                <Box hasBackground borderRadius={borders.radii.sm} padding={spacings.xxl}>
                    <Column height="100%" justifyContent="center" alignItems="center">
                        {isDeviceImageRotating ? (
                            <DeviceAnimation
                                type="ROTATE"
                                deviceModelInternal={deviceModelInternal}
                                deviceUnitColor={deviceUnitColor}
                                height="300px" // NOTE: fill out the fixed height, we know that the video is 2x
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
