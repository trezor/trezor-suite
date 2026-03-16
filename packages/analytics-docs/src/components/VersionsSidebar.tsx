import styled from 'styled-components';

import {
    Badge,
    Box,
    CardList,
    Column,
    H3,
    Icon,
    type IconProps,
    type SuiteThemeColors,
    Text,
    Tooltip,
    variables,
} from '@trezor/components';

import { HEADER_HEIGHT } from '../constants';
import type { EventDoc } from '../types';
import type { VersionWithEvents } from '../utils/filterUtils';
import { getEventId } from '../utils/filterUtils';

const isAdded = (event: EventDoc, version: string) => event.changelog?.addedInVersion === version;

const getEventChangeProps = (event: EventDoc, version: string) =>
    isAdded(event, version)
        ? { name: 'plus' as const, intent: 'brand' as const }
        : { name: 'arrowsClockwiseFilled' as const, intent: 'warning' as const };

const scrollToEvent = (eventName: string) => {
    const el = document.getElementById(getEventId(eventName));
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - HEADER_HEIGHT - 20;
    window.scrollTo({ top: y });
};

export const SIDEBAR_WIDTH = 280;

const SidebarWrapper = styled.aside<{ theme: SuiteThemeColors }>`
    width: ${SIDEBAR_WIDTH}px;
    flex-shrink: 0;
    background: ${({ theme }) => theme.backgroundSurfaceElevation1};
    border-left: 1px solid ${({ theme }) => theme.borderOnElevation1};
    overflow-y: auto;

    @media (min-width: ${variables.SCREEN_SIZE.MD}) {
        position: fixed;
        top: ${HEADER_HEIGHT}px;
        right: 0;
        bottom: 0;
        height: calc(100vh - ${HEADER_HEIGHT}px);
        z-index: 10;
    }

    @media (max-width: ${variables.SCREEN_SIZE.MD}) {
        width: 100%;
        order: 0;
        border-left: none;
        border-bottom: 1px solid ${({ theme }) => theme.borderOnElevation1};
    }
`;

const StickyVersionHeader = styled.div<{ theme: SuiteThemeColors }>`
    position: sticky;
    top: 0;
    z-index: 2;
    background: ${({ theme }) => theme.backgroundSurfaceElevation1};
    padding: 12px 0 8px;
`;

type VersionsSidebarProps = {
    versionsWithEvents: VersionWithEvents[];
    onEventClick?: (eventName: string) => void;
};

export const VersionsSidebar = ({ versionsWithEvents, onEventClick }: VersionsSidebarProps) => (
    <SidebarWrapper>
        <Column gap={0}>
            <H3 margin={{ left: 20, top: 20, bottom: 16 }}>Changelog</H3>
            {versionsWithEvents.map(({ version, events }) => (
                <Box key={version} padding={{ top: 0, bottom: 16, horizontal: 16 }}>
                    <StickyVersionHeader>
                        <Badge intent="brand" size="small">
                            {version}
                        </Badge>
                    </StickyVersionHeader>

                    <CardList margin={{ top: 8 }}>
                        {events
                            .sort((a: EventDoc, b: EventDoc) =>
                                (a.name ?? '').localeCompare(b.name ?? ''),
                            )
                            .map(event => (
                                <CardList.Item
                                    paddingType="small"
                                    onClick={() => {
                                        scrollToEvent(event.name);
                                        onEventClick?.(event.name);
                                    }}
                                    key={event.name}
                                >
                                    <Text typographyStyle="body-xs">{event.name}</Text>

                                    <Tooltip
                                        content={isAdded(event, version) ? 'Added' : 'Updated'}
                                    >
                                        <Icon
                                            {...(getEventChangeProps(event, version) as IconProps)}
                                            size={12}
                                        />
                                    </Tooltip>
                                </CardList.Item>
                            ))}
                    </CardList>
                </Box>
            ))}
        </Column>
    </SidebarWrapper>
);
