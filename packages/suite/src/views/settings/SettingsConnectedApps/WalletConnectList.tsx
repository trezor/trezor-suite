import { useState } from 'react';

import styled from 'styled-components';

import { networksCollection } from '@suite-common/wallet-config';
import { selectSessions, walletConnectDisconnectThunk } from '@suite-common/walletconnect';
import {
    PendingConnectionProposalNetwork,
    WalletConnectSession,
} from '@suite-common/walletconnect/src/walletConnectTypes';
import { Badge, Card, Column, Dropdown, H3, IconCircle, Row, Text } from '@trezor/components';
import { spacings, spacingsPx } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';

const AppIconImage = styled.img`
    width: ${spacingsPx.xxl};
    height: ${spacingsPx.xxl};
    border-radius: ${spacingsPx.md};
    background: ${({ theme }) => theme.backgroundNeutralSubtleOnElevation1};
`;

export const WalletConnectList = () => {
    const dispatch = useDispatch();
    const sessions = useSelector(selectSessions);
    // TODO: we need some sort of proxy to load images from 3rd parties securely
    const [fallbackIcon, setFallbackIcon] = useState(true);

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

    const getNetworks = (session: WalletConnectSession) => {
        const networks: Pick<PendingConnectionProposalNetwork, 'symbol' | 'name'>[] = [];
        session.namespaces.eip155?.chains?.forEach(chain => {
            const supported = networksCollection.find(nc => chain === `eip155:${nc.chainId}`);
            if (supported) {
                networks.push({
                    symbol: supported?.symbol,
                    name: supported?.name ?? `Unknown (${chain})`,
                });
            }
        });

        return networks;
    };

    return (
        <Card paddingType="none">
            <Column hasDivider>
                {sessions.map(session => (
                    <Row key={session.topic} gap={spacings.md} padding={spacings.md}>
                        {fallbackIcon ? (
                            <IconCircle
                                name="walletConnect"
                                size={spacings.xxl}
                                paddingType="small"
                                variant="tertiary"
                                hasBorder={false}
                            />
                        ) : (
                            <AppIconImage
                                src={session.peer.metadata.icons[0]}
                                onError={() => setFallbackIcon(true)}
                            />
                        )}
                        <Column flex="1">
                            <Row gap={spacings.sm}>
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
                                {getNetworks(session)
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
                            ]}
                        />
                    </Row>
                ))}
            </Column>
        </Card>
    );
};
