import { ReactNode } from 'react';
import styled from 'styled-components';
import { LottieAnimation, P, variables } from '@trezor/components';

import { useDevice, useSelector } from 'src/hooks/suite';
import { isWebUsb } from 'src/utils/suite/transport';
import { WebUsbButton } from 'src/components/suite/WebUsbButton';

const StyledLottieAnimation = styled(LottieAnimation)`
    margin: 8px 16px 8px 0;
    min-width: 64px;
    background: ${({ theme }) => theme.BG_GREY};
`;

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    background-color: ${({ theme }) => theme.STROKE_GREY};
    border-radius: 12px;
    margin-bottom: 24px;
    padding: 8px 16px;
    width: 100%;
`;

const Description = styled(P)`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const Column = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100%;
`;

const Title = styled(P)`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        display: flex;
        flex-direction: column;
        align-items: start;
        gap: 0.4rem;
    }
`;

interface DeviceBannerProps {
    title: ReactNode;
    description?: ReactNode;
}

export const DeviceBanner = ({ title, description }: DeviceBannerProps) => {
    const { device } = useDevice();

    const transport = useSelector(state => state.suite.transport);

    const isWebUsbTransport = isWebUsb(transport);

    return (
        <Wrapper data-test="@settings/device/disconnected-device-banner">
            <StyledLottieAnimation
                type="CONNECT"
                shape="CIRCLE"
                size={64}
                deviceModelInternal={device?.features?.internal_model}
                loop
            />
            <Column>
                <Title type="highlight">
                    {title}{' '}
                    {!description && isWebUsbTransport && !device?.connected && <WebUsbButton />}
                </Title>

                {description && <Description>{description}</Description>}
            </Column>
        </Wrapper>
    );
};
