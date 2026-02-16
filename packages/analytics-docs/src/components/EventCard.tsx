import { useState } from 'react';

import {
    Badge,
    Card,
    H3,
    IconButton,
    InfoItem,
    Row,
    Tooltip,
    useMediaQuery,
    variables,
} from '@trezor/components';

import type { EventDoc } from '../types';
import { AddedBadge } from './AddedBadge';
import { AttributesTable } from './AttributesTable';
import { Changelog } from './Changelog';
import { LastUpdatedBadge } from './LastUpdatedBadge';
import { Markdown } from './Markdown';
import { getPlatformIcon } from '../utils/getPlatformIcon';
import { useChangelogButton } from '../utils/useChangelogButton';

const getPlatformDirectory = (platform: string) => {
    switch (platform) {
        case 'mobile':
            return 'suite-native/analytics';
        case 'desktop':
            return 'suite/analytics';
        default:
            return 'suite-common/analytics';
    }
};

const toEventName = (input: string): string =>
    input
        .split(/[/_-]+/)
        .map((part, index) =>
            index === 0
                ? part.toLowerCase()
                : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
        )
        .join('') + 'Event';

const Header = ({ event }: { event: EventDoc }) => {
    const [isCopied, setIsCopied] = useState<boolean>(false);
    const { ChangelogButton, isChangelogOpened } = useChangelogButton();
    const isMobile = useMediaQuery(`(max-width: ${variables.SCREEN_SIZE.MD})`);

    if (!event.name) return null;

    const getEventUrl = (eventName: string) =>
        `https://github.com/trezor/trezor-suite/blob/develop/${getPlatformDirectory(event.platform)}/src/events/${toEventName(eventName)}.ts`;

    return (
        <>
            <Row
                justifyContent="space-between"
                alignItems="center"
                margin={{ bottom: 8 }}
                gap={isMobile ? 0 : 8}
                flexWrap={isMobile ? 'wrap' : undefined}
            >
                <Row gap={16} alignItems="center" overflow="auto" padding={{ bottom: 8 }}>
                    <H3>{event.name} </H3>
                    <Row gap={4}>
                        <Tooltip content="Copy event name">
                            <IconButton
                                onClick={() => {
                                    setIsCopied(true);
                                    navigator.clipboard.writeText(event.name);
                                    setTimeout(() => setIsCopied(false), 1000);
                                }}
                                icon={isCopied ? 'check' : 'copy'}
                                intent={isCopied ? 'brand' : 'neutral'}
                                size="small"
                                priority="secondary"
                            />
                        </Tooltip>
                        <ChangelogButton />
                        <Tooltip content="Open in Github">
                            <IconButton
                                href={getEventUrl(event.name)}
                                icon="arrowLineUpRight"
                                intent="neutral"
                                size="small"
                                priority="secondary"
                            />
                        </Tooltip>
                    </Row>
                </Row>
                <Row gap={8} margin={{ vertical: 12 }}>
                    <AddedBadge>{event.changelog.addedInVersion}</AddedBadge>
                    <LastUpdatedBadge>{event.changelog.lastUpdatedInVersion}</LastUpdatedBadge>

                    <Badge
                        size="small"
                        intent="neutral"
                        iconRight={getPlatformIcon(event.platform)}
                    >
                        {event.platform}
                    </Badge>
                </Row>
            </Row>
            {isChangelogOpened && <Changelog>{event.changelog}</Changelog>}
        </>
    );
};

export const EventCard = ({ event }: { event: EventDoc }) => (
    <Card paddingType="small">
        <Header event={event} />
        <InfoItem label="Trigger" typographyStyle="label">
            <Markdown>{event.descriptionTrigger}</Markdown>
        </InfoItem>
        {event.description && (
            <InfoItem label="Description" typographyStyle="label" margin={{ top: 12 }}>
                <Markdown>{event.description}</Markdown>
            </InfoItem>
        )}
        {event.possibleImprovements && (
            <InfoItem label="Possible improvements" typographyStyle="label" margin={{ top: 12 }}>
                <Markdown>{event.possibleImprovements}</Markdown>
            </InfoItem>
        )}

        <AttributesTable attributes={event.attributes ?? {}} />
    </Card>
);
