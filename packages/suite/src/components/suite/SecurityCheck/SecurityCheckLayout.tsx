import { selectSelectedDevice } from '@suite-common/wallet-core';
import {
    Box,
    Column,
    DeviceAnimation,
    Grid,
    Image,
    useMediaQuery,
    variables,
} from '@trezor/components';
import { DeviceModelInternal } from '@trezor/device-utils';
import { borders, spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';

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
    const isBelowTablet = useMediaQuery(`(max-width: ${variables.SCREEN_SIZE.MD})`);

    const deviceModelInternal = device?.features?.internal_model;
    const imageVariant = isFailed ? 'GHOST' : 'LARGE';
    const isDeviceImageRotating =
        imageMode === 'ROTATE' &&
        deviceModelInternal &&
        [
            DeviceModelInternal.T1B1,
            DeviceModelInternal.T2T1,
            DeviceModelInternal.T2B1,
            DeviceModelInternal.T3B1,
            DeviceModelInternal.T3T1,
        ].includes(deviceModelInternal);

    return (
        <Grid columns={isBelowTablet ? '1fr' : '260px 1fr'} gap={spacings.xl} width="100%">
            {deviceModelInternal && (
                <Box hasBackground borderRadius={borders.radii.sm} padding={spacings.xxl}>
                    <Column height="100%" justifyContent="center" alignItems="center">
                        {isDeviceImageRotating ? (
                            <DeviceAnimation
                                type="ROTATE"
                                deviceModelInternal={deviceModelInternal}
                                deviceUnitColor={device.features?.unit_color}
                                height="300px" // NOTE: fill out the fixed height, we know that the video is 2x
                                sizeVariant="LARGE"
                            />
                        ) : (
                            <Image
                                maxHeight={300}
                                isFilterActive={false}
                                image={`TREZOR_${deviceModelInternal}_${imageVariant}`}
                            />
                        )}
                    </Column>
                </Box>
            )}
            <Column justifyContent="space-between">{children}</Column>
        </Grid>
    );
};
