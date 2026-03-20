import type { JSX } from 'react';

import styled from 'styled-components';

import {
    Badge,
    Box,
    CardList,
    Column,
    H3,
    Icon,
    type IconProps,
    Paragraph,
    type SuiteThemeColors,
    Text,
    Tooltip,
    variables,
} from '@trezor/components';

import type { EventDoc } from '../types';
import type { VersionWithEvents } from '../utils/filterUtils';

type ChangeInfo = {
    isEventAdded: boolean;
    isEventUpdated: boolean;
    addedAttributes: string[];
    updatedAttributes: string[];
};

const getChangeInfo = (event: EventDoc, version: string): ChangeInfo => {
    const info: ChangeInfo = {
        isEventAdded: false,
        isEventUpdated: false,
        addedAttributes: [],
        updatedAttributes: [],
    };

    const eventAddedVersion = event.changelog?.addedInVersion;
    const isEventAddedInThisVersion = eventAddedVersion === version;

    const eventChanges = event.changelog?.entries?.filter(e => e.version === version);
    if (eventChanges && eventChanges.length > 0) {
        const hasEventLevelChanges = eventChanges.some(
            c =>
                c.notes.toLowerCase().includes('added') || !c.notes.toLowerCase().includes('added'),
        );

        if (isEventAddedInThisVersion && hasEventLevelChanges) {
            info.isEventAdded = true;
        } else if (!isEventAddedInThisVersion && hasEventLevelChanges) {
            info.isEventUpdated = true;
        }
    }

    for (const [attrName, attrDoc] of Object.entries(event.attributes)) {
        const attrChanges = attrDoc.changelog?.entries?.filter(e => e.version === version);
        if (attrChanges && attrChanges.length > 0) {
            const attrAddedVersion = attrDoc.changelog?.addedInVersion;
            const isAttrAddedInThisVersion = attrAddedVersion === version;

            if (isAttrAddedInThisVersion && isEventAddedInThisVersion) {
                continue;
            }

            if (isAttrAddedInThisVersion) {
                info.addedAttributes.push(attrName);
            } else {
                info.updatedAttributes.push(attrName);
            }
        }
    }

    if (
        !info.isEventAdded &&
        !info.isEventUpdated &&
        (info.addedAttributes.length > 0 || info.updatedAttributes.length > 0)
    ) {
        info.isEventUpdated = true;
    }

    return info;
};

const getTooltipContent = (changeInfo: ChangeInfo) => {
    const elements: JSX.Element[] = [];

    if (changeInfo.isEventAdded) {
        elements.push(
            <Paragraph key="event-added" typographyStyle="body-sm-strong">
                Event added.
            </Paragraph>,
        );
    }

    if (changeInfo.isEventUpdated) {
        elements.push(
            <Paragraph key="event-updated" typographyStyle="body-sm-strong">
                Event updated.
            </Paragraph>,
        );
    }

    if (changeInfo.addedAttributes.length > 0) {
        elements.push(
            <Paragraph key="attrs-added-title" typographyStyle="body-sm-strong">
                Attribute{changeInfo.addedAttributes.length > 1 ? 's' : ''} added:
            </Paragraph>,
        );
        changeInfo.addedAttributes.forEach(attr => {
            elements.push(
                <Paragraph key={`added-${attr}`} typographyStyle="body-xs">
                    &nbsp;&nbsp;- {attr}
                </Paragraph>,
            );
        });
    }

    if (changeInfo.updatedAttributes.length > 0) {
        elements.push(
            <Paragraph key="attrs-updated-title" typographyStyle="body-sm-strong">
                Attribute{changeInfo.updatedAttributes.length > 1 ? 's' : ''} updated:
            </Paragraph>,
        );
        changeInfo.updatedAttributes.forEach(attr => {
            elements.push(
                <Paragraph key={`updated-${attr}`} typographyStyle="body-xs">
                    &nbsp;&nbsp;- <Text isMonospaced>{attr}</Text>
                </Paragraph>,
            );
        });
    }

    return <Column gap={4}>{elements}</Column>;
};

const getEventChangeProps = (changeInfo: ChangeInfo) =>
    changeInfo.isEventAdded
        ? { name: 'plus' as const, intent: 'brand' as const }
        : { name: 'arrowsClockwiseFilled' as const, intent: 'warning' as const };

const SidebarWrapper = styled.aside<{ theme: SuiteThemeColors }>`
    width: 100%;
    height: 100%;
    min-height: 0;
    flex-shrink: 0;
    background: ${({ theme }) => theme.backgroundSurfaceElevation1};
    border-left: 1px solid ${({ theme }) => theme.borderOnElevation1};
    overflow-y: auto;
    display: flex;
    flex-direction: column;

    @media (max-width: ${variables.SCREEN_SIZE.MD}) {
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
                            .map(event => {
                                const changeInfo = getChangeInfo(event, version);

                                return (
                                    <CardList.Item
                                        paddingType="small"
                                        onClick={() => {
                                            onEventClick?.(event.name);
                                        }}
                                        key={event.name}
                                    >
                                        <Text typographyStyle="body-xs">{event.name}</Text>

                                        <Tooltip content={getTooltipContent(changeInfo)}>
                                            <Icon
                                                {...(getEventChangeProps(changeInfo) as IconProps)}
                                                size={12}
                                            />
                                        </Tooltip>
                                    </CardList.Item>
                                );
                            })}
                    </CardList>
                </Box>
            ))}
        </Column>
    </SidebarWrapper>
);
