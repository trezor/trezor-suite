import styled from 'styled-components';

import { Translation } from '@suite/intl';
import {
    CALL_SOURCE_WALLETCONNECT,
    connectPopupActions,
    selectConnectPopupCall,
} from '@suite-common/connect-popup';
import { selectSelectedDevice } from '@suite-common/device';
import { Box, Icon, Row, Text } from '@trezor/components';
import { borders, spacings } from '@trezor/theme';

import { DeviceStatus } from 'src/components/suite/layouts/SuiteLayout/DeviceSelector/DeviceStatus';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { TrafficLightOffset } from './TrafficLightOffset';
import { SuiteBanners } from './banners';

export const ConnectBarWrapper = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
`;

interface ConnectAppBarProps {
    canSwitchDevice?: boolean;
}

export const ConnectAppBar = ({ canSwitchDevice }: ConnectAppBarProps) => {
    const connectPopupCall = useSelector(selectConnectPopupCall);
    const dispatch = useDispatch();
    const device = useSelector(selectSelectedDevice);

    if (!connectPopupCall || connectPopupCall.state === 'finished') return null;

    const isWalletConnect =
        connectPopupCall.state !== 'error' &&
        connectPopupCall.source?.type === CALL_SOURCE_WALLETCONNECT;

    const onSelectDevice = () => {
        if (!canSwitchDevice || isWalletConnect) return;
        dispatch(connectPopupActions.switchDevice());
    };

    return (
        <ConnectBarWrapper>
            <Box
                backgroundColor="surfaceFillPage"
                padding={{
                    horizontal: spacings.xl,
                    vertical: spacings.md,
                }}
                borderWidth={{ bottom: borders.widths.large }}
            >
                <TrafficLightOffset>
                    <Row gap={spacings.sm} alignItems="center" justifyContent="space-between">
                        {device?.features?.internal_model && (
                            <Row
                                gap={spacings.lg}
                                alignItems="center"
                                onClick={onSelectDevice}
                                cursor={canSwitchDevice && !isWalletConnect ? 'pointer' : 'default'}
                            >
                                <DeviceStatus
                                    deviceModel={device.features.internal_model}
                                    device={device}
                                />
                                {canSwitchDevice && !isWalletConnect && (
                                    <Icon size={20} name="caretCircleDown" />
                                )}
                            </Row>
                        )}
                        {connectPopupCall.state !== 'error' && (
                            <Row gap={spacings.xs} alignItems="center">
                                <Icon
                                    name={isWalletConnect ? 'walletConnect' : 'plugs'}
                                    intent="neutral"
                                    priority="secondary"
                                />
                                <Text intent="neutral" priority="secondary">
                                    <Translation
                                        id={
                                            isWalletConnect
                                                ? 'TR_WALLETCONNECT'
                                                : 'TR_TREZOR_CONNECT'
                                        }
                                    />
                                </Text>
                            </Row>
                        )}
                    </Row>
                </TrafficLightOffset>
            </Box>
            <SuiteBanners fill />
        </ConnectBarWrapper>
    );
};
