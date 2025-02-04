import { ReactNode } from 'react';

import styled from 'styled-components';

import { isDeviceAcquired } from '@suite-common/suite-utils';
import { Card, Column, LottieAnimation, Paragraph, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { WebUsbButton } from 'src/components/suite/WebUsbButton';
import { useDevice, useSelector } from 'src/hooks/suite';
import { selectHasTransportOfType } from 'src/reducers/suite/suiteReducer';

import { AcquireDeviceButton } from '../suite/AcquireDeviceButton';

const StyledAcquireDeviceButton = styled(AcquireDeviceButton)`
    margin-left: auto;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledLottieAnimation = styled(LottieAnimation)`
    margin: 8px 16px 8px 0;
    min-width: 64px;
    background: ${({ theme }) => theme.legacy.BG_GREY};
`;

type DeviceBannerProps = {
    title: ReactNode;
    description?: ReactNode;
};

export const DeviceBanner = ({ title, description }: DeviceBannerProps) => {
    const { device } = useDevice();
    const isWebUsbTransport = useSelector(selectHasTransportOfType('WebUsbTransport'));
    const deviceConnectedButNotAcquired = device && !isDeviceAcquired(device);

    return (
        <Card
            data-testid="@settings/device/disconnected-device-banner"
            margin={{ bottom: spacings.lg }}
        >
            <Row>
                <StyledLottieAnimation
                    type="CONNECT"
                    shape="CIRCLE"
                    size={64}
                    deviceModelInternal={device?.features?.internal_model}
                    loop
                />
                <Column>
                    <Row gap={spacings.sm} flexWrap="wrap">
                        <Paragraph typographyStyle="highlight">{title}</Paragraph>
                        {!description && isWebUsbTransport && !device?.connected && (
                            <WebUsbButton />
                        )}
                    </Row>
                    {description && <Text color="textSubdued">{description}</Text>}
                </Column>
                {deviceConnectedButNotAcquired && <StyledAcquireDeviceButton />}{' '}
            </Row>
        </Card>
    );
};
