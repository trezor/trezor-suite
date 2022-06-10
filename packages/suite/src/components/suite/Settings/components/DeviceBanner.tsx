import React from 'react';
import styled from 'styled-components';
import { P, variables } from '@trezor/components';

import { DeviceAnimation } from '@onboarding-components';
import { useDevice, useSelector } from '@suite-hooks';
import { isWebUsb } from '@suite-utils/transport';
import { WebUsbButton } from '@suite-components/WebUsbButton';

const DeviceBadge = styled(DeviceAnimation)`
    margin: 8px 16px 8px 0;
    min-width: 64px;
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
    title: React.ReactNode;
    description?: React.ReactNode;
}

export const DeviceBanner = ({ title, description }: DeviceBannerProps) => {
    const { device } = useDevice();

    const { transport } = useSelector(state => ({
        transport: state.suite.transport,
    }));

    const isWebUsbTransport = isWebUsb(transport);

    return (
        <Wrapper data-test="@settings/device/disconnected-device-banner">
            <DeviceBadge type="CONNECT" shape="CIRCLE" size={64} device={device} />
            <Column>
                <Title weight="bold">
                    {title}{' '}
                    {!description && isWebUsbTransport && !device?.connected && (
                        <WebUsbButton icon="SEARCH" />
                    )}
                </Title>

                {description && <Description>{description}</Description>}
            </Column>
        </Wrapper>
    );
};
