import { useSelector } from 'react-redux';

import { selectIsDebugModeActive } from '@suite/debug';
import { Translation } from '@suite/intl';
import {
    type SuiteSyncRelayConnection,
    selectIsSuiteSyncEnabled,
    selectIsSuiteSyncRelayConnected,
    selectLastSuiteSyncRelayDisconnectedTimestamp,
    selectSuiteSyncRelayConnectionStatuses,
} from '@suite-common/suite-sync';
import { Column, Row, Text } from '@trezor/components';
import { ArrowsClockwiseIcon, CheckIcon, CircleIcon } from '@trezor/icons';
import { QuickActionButton, RelativeTime } from '@trezor/product-components';

import { SuiteSyncConnectionStatusDot } from './SuiteSyncConnectionStatusDot';

type RelayConnectionStatusListProps = {
    connections: SuiteSyncRelayConnection[];
};

const RelayConnectionStatusList = ({ connections }: RelayConnectionStatusListProps) => (
    <Column gap={4} width="100%" minWidth={0}>
        <Text typographyStyle="body-sm-strong" intent="accentViolet">
            Relays:
        </Text>
        <Column as="ul" gap={4} width="100%" minWidth={0} margin={{}} padding={{}}>
            {connections.map(connection => (
                <Row as="li" key={connection.url} gap={8} width="100%" minWidth={0}>
                    <SuiteSyncConnectionStatusDot isConnected={connection.state === 'connected'} />
                    <Text
                        isMonospaced
                        typographyStyle="body-xs"
                        intent="accentViolet"
                        overflowWrap="anywhere"
                        flex="1"
                        minWidth={0}
                    >
                        {connection.url}
                    </Text>
                </Row>
            ))}
        </Column>
    </Column>
);

type LastSyncedProps = {
    timestamp: number;
};

const LastSynced = ({ timestamp }: LastSyncedProps) => (
    <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
        <Translation
            id="TR_SUITE_SYNC_LAST_SYNCED"
            values={{ relativeTime: <RelativeTime timestamp={timestamp} /> }}
        />
    </Text>
);

export const SuiteSyncQuickAction = () => {
    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);
    const isDebugModeActive = useSelector(selectIsDebugModeActive);
    const isConnected = useSelector(selectIsSuiteSyncRelayConnected);
    const lastDisconnectedTimestamp = useSelector(selectLastSuiteSyncRelayDisconnectedTimestamp);
    const relayConnectionStatuses = useSelector(selectSuiteSyncRelayConnectionStatuses);

    if (!isSuiteSyncEnabled) {
        return null;
    }

    return (
        <QuickActionButton
            tooltip={{
                content: (
                    <Column gap={8} padding={4} alignItems="start">
                        <Text typographyStyle="body-md-strong">
                            <Translation id="TR_EXPERIMENTAL_SUITE_SYNC_TITLE" />
                        </Text>
                        <Row gap={8}>
                            <SuiteSyncConnectionStatusDot isConnected={isConnected} />
                            <Text typographyStyle="body-sm">
                                <Translation
                                    id={
                                        isConnected
                                            ? 'TR_SUITE_SYNC_SYNCED'
                                            : 'TR_SUITE_SYNC_NOT_SYNCED'
                                    }
                                />
                            </Text>
                        </Row>
                        {isDebugModeActive && (
                            <RelayConnectionStatusList connections={relayConnectionStatuses} />
                        )}
                        {!isConnected && lastDisconnectedTimestamp !== null && (
                            <LastSynced timestamp={lastDisconnectedTimestamp} />
                        )}
                    </Column>
                ),
            }}
            icon={ArrowsClockwiseIcon}
            subIcon={isConnected ? CheckIcon : CircleIcon}
            subIconIntent={isConnected ? 'brand' : 'neutral'}
        />
    );
};
