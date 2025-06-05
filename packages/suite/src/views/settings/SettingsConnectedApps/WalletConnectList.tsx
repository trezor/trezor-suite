import {
    getSessionNetworks,
    selectSessions,
    walletConnectDisconnectThunk,
} from '@suite-common/walletconnect';
import { Badge, Card, Column, Dropdown, H3, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import * as modalActions from 'src/actions/suite/modalActions';
import { Translation } from 'src/components/suite';
import { ConnectAppIcon } from 'src/components/suite/ConnectAppIcon';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const WalletConnectList = () => {
    const dispatch = useDispatch();
    const sessions = useSelector(selectSessions);

    if (sessions.length === 0) {
        return (
            <Column flex="1" justifyContent="center" gap={spacings.xs}>
                <H3 align="center">
                    <Translation id="TR_NO_CONNECTED_APPS" />
                </H3>
                <Text align="center" variant="tertiary">
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
                        gap={spacings.md}
                        padding={spacings.md}
                        data-testid={`@settings/walletconnect-apps/${index}`}
                    >
                        <ConnectAppIcon src={session.peer.metadata.icons[0]} type="walletConnect" />
                        <Column flex="1">
                            <Row columnGap={spacings.sm} rowGap={spacings.xxxs} flexWrap="wrap">
                                <Text>{session.peer.metadata.name}</Text>
                                <Text variant="tertiary">{session.peer.metadata.url}</Text>
                                {session.validation === 'VALID' && (
                                    <Badge variant="info" icon="shieldCheckFilled">
                                        <Translation id="TR_WALLETCONNECT_SERVICE_VERIFIED" />
                                    </Badge>
                                )}
                                {session.validation === 'UNKNOWN' && (
                                    <Badge variant="warning" icon="shieldWarningFilled">
                                        <Translation id="TR_WALLETCONNECT_SERVICE_UNKNOWN" />
                                    </Badge>
                                )}
                                {session.validation === 'INVALID' && (
                                    <Badge variant="destructive" icon="shieldWarningFilled">
                                        <Translation id="TR_WALLETCONNECT_SERVICE_DANGEROUS" />
                                    </Badge>
                                )}
                            </Row>

                            <Text variant="tertiary">
                                {getSessionNetworks(session)
                                    .map(network => network.name)
                                    .join(', ')}
                            </Text>
                        </Column>

                        <Dropdown
                            placement={{ position: 'bottom', alignment: 'end' }}
                            items={[
                                {
                                    icon: 'xCircle',
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
                                    icon: 'arrowsClockwise',
                                    label: <Translation id="TR_SWITCH_ACCOUNT" />,
                                    onClick: () => {
                                        dispatch(
                                            modalActions.openModal({
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
