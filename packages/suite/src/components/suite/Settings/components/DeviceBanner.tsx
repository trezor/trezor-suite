import React from 'react';
import styled from 'styled-components';
import { DeviceAnimation } from '@onboarding-components';
import { P } from '@trezor/components';
import { useDevice } from '@suite-hooks';

const DeviceBadge = styled(DeviceAnimation)`
    margin: 8px 16px;
    min-width: 64px;
`;

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    background-color: ${({ theme }) => theme.STROKE_GREY};
    border-radius: 12px;
    margin-bottom: 24px;
`;

const Description = styled(P)`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const Column = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 16px 4px;
`;

interface Props {
    title: React.ReactNode;
    description?: React.ReactNode;
}

const DeviceBanner = ({ title, description }: Props) => {
    const { device } = useDevice();
    return (
        <Wrapper data-test="@settings/device/disconnected-device-banner">
            <DeviceBadge type="CONNECT" shape="CIRCLE" size={64} device={device} />
            <Column>
                <P weight="bold">{title}</P>
                {description && <Description>{description}</Description>}
            </Column>
        </Wrapper>
    );
};

export default DeviceBanner;
