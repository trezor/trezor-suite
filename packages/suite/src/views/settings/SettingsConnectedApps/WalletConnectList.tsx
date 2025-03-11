import { useState } from 'react';

import styled from 'styled-components';

import { selectSessions, walletConnectDisconnectThunk } from '@suite-common/walletconnect';
import { Column, Dropdown, IconCircle, Row, Text } from '@trezor/components';
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
            <Row padding={spacings.xl} justifyContent="center">
                <Text align="center" variant="tertiary">
                    <Translation id="TR_NO_CONNECTED_APPS" />
                </Text>
            </Row>
        );
    }

    return (
        <>
            <Column flex="1" hasDivider>
                {sessions.map(session => (
                    <Row key={session.topic} gap={spacings.md} padding={spacings.md}>
                        {fallbackIcon ? (
                            <IconCircle
                                name="appWindow"
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
                            <Text>{session.peer.metadata.name}</Text>
                            <Text variant="tertiary">{session.peer.metadata.url}</Text>
                        </Column>

                        <Dropdown
                            placement={{ position: 'bottom', alignment: 'end' }}
                            items={[
                                {
                                    key: 'group1',
                                    options: [
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
                                    ],
                                },
                            ]}
                        />
                    </Row>
                ))}
            </Column>
        </>
    );
};
