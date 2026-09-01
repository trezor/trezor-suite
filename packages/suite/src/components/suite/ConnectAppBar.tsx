import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { TrafficLightOffset } from '@suite/macos';
import {
    CALL_SOURCE_WALLETCONNECT,
    connectPopupActions,
    selectConnectPopupCall,
} from '@suite-common/connect-popup';
import { selectSelectedDevice } from '@suite-common/device';
import { useDispatch } from '@suite-common/redux-utils';
import { Box, Icon, Row, Text } from '@trezor/components';
import { CaretCircleDownIcon, PlugsIcon, WalletConnectIcon } from '@trezor/icons';

import { DeviceStatus } from 'src/components/suite/layouts/SuiteLayout/DeviceSelector/DeviceStatus';
import { useSelector } from 'src/hooks/suite';

import { SuiteBanners } from './banners';

export const ConnectBarWrapper = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    background: ${({ theme }) => theme.surfaceFillFixed};
    border-bottom: 1px solid ${({ theme }) => theme.surfaceBorderFixed};
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
                padding={{
                    horizontal: 24,
                    vertical: 16,
                }}
            >
                <TrafficLightOffset>
                    <Row gap={12} alignItems="center" justifyContent="space-between">
                        {device?.features?.internal_model && (
                            <Row
                                gap={20}
                                alignItems="center"
                                onClick={onSelectDevice}
                                cursor={canSwitchDevice && !isWalletConnect ? 'pointer' : 'default'}
                            >
                                <DeviceStatus
                                    deviceModel={device.features.internal_model}
                                    device={device}
                                />
                                {canSwitchDevice && !isWalletConnect && (
                                    <Icon size={20} as={CaretCircleDownIcon} />
                                )}
                            </Row>
                        )}
                        {connectPopupCall.state !== 'error' && (
                            <Row gap={8} alignItems="center">
                                <Icon
                                    as={isWalletConnect ? WalletConnectIcon : PlugsIcon}
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
