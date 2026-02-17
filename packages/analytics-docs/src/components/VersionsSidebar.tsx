import styled from 'styled-components';

import type { SuiteThemeColors } from '@trezor/components';
import { Badge, Box, CardList, Column, H3, Text, variables } from '@trezor/components';

import { HEADER_HEIGHT } from '../constants';
import type { EventDoc } from '../types';
import type { VersionWithEvents } from '../utils/filterUtils';
import { getEventId } from '../utils/filterUtils';

const SCROLL_OFFSET_TOP = 110;

const scrollToEvent = (eventName: string) => {
    const el = document.getElementById(getEventId(eventName));
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET_TOP;
    window.scrollTo({ top: y, behavior: 'smooth' });
};

export const SIDEBAR_WIDTH = 280;

const SidebarWrapper = styled.aside<{ theme: SuiteThemeColors }>`
    width: ${SIDEBAR_WIDTH}px;
    flex-shrink: 0;
    background: ${({ theme }) => theme.backgroundSurfaceElevation1};
    border-right: 1px solid ${({ theme }) => theme.borderOnElevation1};
    padding: 16px 0;
    overflow-y: auto;

    @media (min-width: ${variables.SCREEN_SIZE.MD}) {
        position: fixed;
        top: ${HEADER_HEIGHT}px;
        left: 0;
        bottom: 0;
        height: calc(100vh - ${HEADER_HEIGHT}px);
        z-index: 10;
    }

    @media (max-width: ${variables.SCREEN_SIZE.MD}) {
        width: 100%;
        border-right: none;
        border-bottom: 1px solid ${({ theme }) => theme.borderOnElevation1};
    }
`;

type VersionsSidebarProps = {
    versionsWithEvents: VersionWithEvents[];
};

export const VersionsSidebar = ({ versionsWithEvents }: VersionsSidebarProps) => (
    <SidebarWrapper>
        <Column gap={0}>
            <H3 margin={{ left: 20, top: 8, bottom: 16 }}>Changelog</H3>
            {versionsWithEvents.map(({ version, events }) => (
                <Box key={version} padding={{ top: 0, bottom: 16, horizontal: 16 }}>
                    <Badge intent="brand" size="small">
                        {version}
                    </Badge>

                    <CardList margin={{ top: 8 }}>
                        {events
                            .sort((a: EventDoc, b: EventDoc) =>
                                (a.name ?? '').localeCompare(b.name ?? ''),
                            )
                            .map(event => (
                                <CardList.Item
                                    paddingType="small"
                                    onClick={() => scrollToEvent(event.name)}
                                    key={event.name}
                                >
                                    <Text typographyStyle="label">{event.name}</Text>
                                </CardList.Item>
                            ))}
                    </CardList>
                </Box>
            ))}
        </Column>
    </SidebarWrapper>
);
