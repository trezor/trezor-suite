import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { useDispatch } from '@suite-common/redux-utils';
import {
    getSessionNetworks,
    selectSessions,
    walletConnectDisconnectThunk,
} from '@suite-common/walletconnect';
import { Badge, Card, Column, Dropdown, H3, Row, Text } from '@trezor/components';
import {
    ArrowsClockwiseIcon,
    ShieldCheckFilledIcon,
    ShieldWarningFilledIcon,
    XCircleIcon,
} from '@trezor/icons';

import { ConnectAppIcon } from 'src/components/suite/ConnectAppIcon';
import { useSelector } from 'src/hooks/suite';

export const WalletConnectList = () => {
    const dispatch = useDispatch();
    const sessions = useSelector(selectSessions);

    if (sessions.length === 0) {
        return (
            <Column flex="1" justifyContent="center" gap={8}>
                <H3 align="center">
                    <Translation id="TR_NO_CONNECTED_APPS" />
                </H3>
                <Text align="center" intent="neutral" priority="secondary">
                    <Translation id="TR_NO_CONNECTED_APPS_DESCRIPTION" />
                </Text>
            </Column>
        );
    }

    return (
        <Card paddingType="none">
            <Column hasDivider>
                {sessions.map((session, index) => (
                    <Row
                        key={session.topic}
                        gap={16}
                        padding={16}
                        data-testid={`@settings/walletconnect-apps/${index}`}
                    >
                        <ConnectAppIcon
                            src={session.peer.metadata.icons?.[0]}
                            type="walletConnect"
                        />
                        <Column flex="1">
                            <Row columnGap={12} rowGap={2} flexWrap="wrap">
                                <Text>{session.peer.metadata.name}</Text>
                                <Text intent="neutral" priority="secondary">
                                    {session.peer.metadata.url}
                                </Text>
                                {session.validation === 'VALID' && (
                                    <Badge intent="info" iconLeft={ShieldCheckFilledIcon}>
                                        <Translation id="TR_WALLETCONNECT_SERVICE_VERIFIED" />
                                    </Badge>
                                )}
                                {session.validation === 'UNKNOWN' && (
                                    <Badge intent="warning" iconLeft={ShieldWarningFilledIcon}>
                                        <Translation id="TR_WALLETCONNECT_SERVICE_UNKNOWN" />
                                    </Badge>
                                )}
                                {session.validation === 'INVALID' && (
                                    <Badge intent="critical" iconLeft={ShieldWarningFilledIcon}>
                                        <Translation id="TR_WALLETCONNECT_SERVICE_DANGEROUS" />
                                    </Badge>
                                )}
                            </Row>

                            <Text intent="neutral" priority="secondary">
                                {getSessionNetworks(session)
                                    .map(network => network.name)
                                    .join(', ')}
                            </Text>
                        </Column>

                        <Dropdown
                            placement={{ position: 'bottom', alignment: 'end' }}
                            tooltip={{
                                content: <Translation id="TR_SHOW_MORE" />,
                                placement: 'left',
                            }}
                            items={[
                                {
                                    icon: XCircleIcon,
                                    label: <Translation id="TR_DISCONNECT" />,
                                    onClick: () => {
                                        dispatch(
                                            walletConnectDisconnectThunk({
                                                topic: session.topic,
                                            }),
                                        );
                                    },
                                },
                                {
                                    icon: ArrowsClockwiseIcon,
                                    label: <Translation id="TR_SWITCH_ACCOUNT" />,
                                    onClick: () => {
                                        dispatch(
                                            openModal({
                                                type: 'walletconnect-switch-account',
                                                sessionTopic: session.topic,
                                            }),
                                        );
                                    },
                                },
                            ]}
                        />
                    </Row>
                ))}
            </Column>
        </Card>
    );
};
