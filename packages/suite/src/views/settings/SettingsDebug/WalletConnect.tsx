import { useState } from 'react';

import {
    selectSessions,
    walletConnectDisconnectThunk,
    walletConnectPairThunk,
} from '@suite-common/walletconnect';
import { Button, Column, Input, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import {
    ActionButton,
    ActionColumn,
    SectionItem,
    StatusLight,
    TextColumn,
    Translation,
} from 'src/components/suite';
import { useDispatch, useSelector, useTranslation } from 'src/hooks/suite';

export const WalletConnect = () => {
    const dispatch = useDispatch();
    const [connectionUrl, setConnectionUrl] = useState('');
    const sessions = useSelector(selectSessions);
    const { translationString } = useTranslation();

    const handleConnect = () => {
        dispatch(walletConnectPairThunk({ uri: connectionUrl }));
        setConnectionUrl(''); // Clear input after attempt
    };

    return (
        <>
            <SectionItem data-test="@settings/walletconnect">
                <Row flex="1">
                    <Input
                        value={connectionUrl}
                        onChange={e => setConnectionUrl(e.target.value)}
                        size="small"
                        placeholder={translationString('TR_WALLETCONNECT_NEW_CONNECTION_URL')}
                    />
                    <ActionButton onClick={handleConnect}>
                        <Translation id="TR_CONNECT" />
                    </ActionButton>
                </Row>
            </SectionItem>
            <SectionItem>
                <TextColumn title={<Translation id="TR_WALLETCONNECT_SESSIONS" />} />
                <ActionColumn>
                    <Column gap={spacings.md}>
                        {sessions.map(session => (
                            <Row key={session.topic} gap={spacings.md}>
                                <StatusLight variant="primary" />
                                <Column flex="1">
                                    <Text>{session.peer.metadata.name}</Text>
                                    <Text variant="tertiary">{session.peer.metadata.url}</Text>
                                    <Text variant="tertiary">{session.topic}</Text>
                                </Column>
                                <Button
                                    onClick={() => {
                                        dispatch(
                                            walletConnectDisconnectThunk({ topic: session.topic }),
                                        );
                                    }}
                                    size="small"
                                    variant="destructive"
                                >
                                    <Translation id="TR_DISCONNECT" />
                                </Button>
                            </Row>
                        ))}
                    </Column>
                </ActionColumn>
            </SectionItem>
        </>
    );
};
