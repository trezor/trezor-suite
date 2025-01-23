import styled from 'styled-components';

import { selectSelectedDevice } from '@suite-common/wallet-core';
import { DeviceAnimation, Image, variables } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/connect';

import { useSelector } from 'src/hooks/suite';

const Wrapper = styled.div`
    display: grid;
    grid-template-columns: 260px 1fr;
    gap: 24px;
    width: 100%;

    @media only screen and (max-width: ${variables.SCREEN_SIZE.XL}) {
        grid-template-columns: 1fr;
        flex-direction: column;
    }
`;

const ImageWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: ${({ theme }) => theme.legacy.BG_GREY};
    border-radius: 12px;
    padding: 32px;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledImage = styled(Image)`
    max-height: 300px;

    /* do not apply the darkening filter in dark mode on device images */
    filter: none;
`;

const Content = styled.div`
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
`;

interface SecurityCheckLayoutProps {
    isFailed?: boolean;
    children: React.ReactNode;
    imageMode?: 'ROTATE' | 'STATIC';
}

export const SecurityCheckLayout = ({
    isFailed,
    children,
    imageMode,
}: SecurityCheckLayoutProps) => {
    const device = useSelector(selectSelectedDevice);

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
        <Wrapper>
            {deviceModelInternal && (
                <ImageWrapper>
                    {isDeviceImageRotating ? (
                        <DeviceAnimation
                            type="ROTATE"
                            deviceModelInternal={deviceModelInternal}
                            deviceUnitColor={device.features?.unit_color}
                            height="300px" // NOTE: fill out the fixed height, we know that the video is 2x
                            sizeVariant="LARGE"
                        />
                    ) : (
                        <StyledImage image={`TREZOR_${deviceModelInternal}_${imageVariant}`} />
                    )}
                </ImageWrapper>
            )}
            <Content>{children}</Content>
        </Wrapper>
    );
};
