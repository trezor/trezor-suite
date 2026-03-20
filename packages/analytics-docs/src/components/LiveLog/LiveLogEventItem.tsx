import { useState } from 'react';

import { format } from 'date-fns';
import styled from 'styled-components';

import {
    CardList,
    Column,
    IconButton,
    Row,
    type SuiteThemeColors,
    TOOLTIP_DELAY_LONG,
    Text,
    Tooltip,
} from '@trezor/components';

import { EventPayload, hasEventPayload } from './EventPayload';
import type { LiveLogEvent } from '../../types';

const NewEventDot = styled.div<{ theme: SuiteThemeColors }>`
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${({ theme }) => theme.backgroundPrimaryDefault};
    flex: 0 0 auto;
`;

type LiveLogEventItemProps = {
    event: LiveLogEvent;
    onEventClick: (eventName: string) => void;
    isNew: boolean;
    showMetaInPayload: boolean;
};

export const LiveLogEventItem = ({
    event,
    onEventClick,
    isNew,
    showMetaInPayload,
}: LiveLogEventItemProps) => {
    const [isPayloadOpen, setIsPayloadOpen] = useState(false);
    const hasPayload = hasEventPayload(event, showMetaInPayload);

    return (
        <CardList.Item key={event.id} paddingType="small">
            <Column gap={4} margin={{ vertical: 4 }} alignItems="stretch" width="100%">
                <Row
                    onClick={e => {
                        e.stopPropagation();
                        setIsPayloadOpen(prev => !prev);
                    }}
                    justifyContent="space-between"
                    alignItems="center"
                    gap={12}
                >
                    <Column gap={2} flex="1" minWidth={0}>
                        <Text typographyStyle="body-sm-strong">{event.type}</Text>
                        <Row gap={4} minWidth={0}>
                            <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
                                {format(new Date(event.receivedAt), 'HH:mm:ss')}
                            </Text>
                            {isNew && <NewEventDot aria-label="New event" />}
                        </Row>
                    </Column>
                    {hasPayload && (
                        <Tooltip content="Find event" delayShow={TOOLTIP_DELAY_LONG}>
                            <IconButton
                                icon="magnifyingGlass"
                                size="small"
                                intent="neutral"
                                priority="secondary"
                                onClick={e => {
                                    onEventClick(event.type);
                                    e.stopPropagation();
                                }}
                            />
                        </Tooltip>
                    )}
                </Row>
                <EventPayload
                    event={event}
                    isPayloadOpen={isPayloadOpen}
                    showMetaInPayload={showMetaInPayload}
                />
            </Column>
        </CardList.Item>
    );
};
