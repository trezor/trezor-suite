import { useEffect, useState } from 'react';

import {
    Badge,
    Card,
    Dropdown,
    H3,
    InfoItem,
    Row,
    Text,
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
import { getEventId, toEventExportName } from '../utils/filterUtils';
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

const COPY_FEEDBACK_MS = 2000;

type HeaderProps = {
    event: EventDoc;
    onEdit?: (event: EventDoc) => void;
};

const Header = ({ event, onEdit }: HeaderProps) => {
    const { ChangelogButton, isChangelogOpened } = useChangelogButton();
    const isMobile = useMediaQuery(`(max-width: ${variables.SCREEN_SIZE.MD})`);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return;
        const id = setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);

        return () => clearTimeout(id);
    }, [copied]);

    if (!event.name) return null;

    const getEventDefinitionUrl = (eventName: string) =>
        `https://github.com/trezor/trezor-suite/blob/develop/${getPlatformDirectory(event.platform)}/src/events/${toEventExportName(eventName)}.ts`;

    const getEventUsagesUrl = (eventName: string) =>
        `https://github.com/search?q=repo%3Atrezor%2Ftrezor-suite%20${toEventExportName(eventName)}.name&type=code`;

    const getEventAnchorLink = () =>
        `${typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''}#${getEventId(event.name)}`;

    const handleCopyLink = () => {
        const link = getEventAnchorLink();
        void navigator.clipboard?.writeText(link);
        setCopied(true);
    };

    const copyExportName = () => {
        void navigator.clipboard?.writeText(toEventExportName(event.name));
        setCopied(true);
    };

    const handleCopyExportNameClick = (e: React.MouseEvent) => {
        if (e.detail !== 3) return;
        copyExportName();
    };

    const handleCopyExportNameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            copyExportName();
        }
    };

    const dropdownItems = [
        ...(onEdit
            ? [
                  {
                      key: 'edit',
                      label: 'Edit',
                      icon: 'pencil' as const,
                      onClick: () => onEdit(event),
                  },
              ]
            : []),
        {
            key: 'open-definition',
            label: 'Open definition on Github',
            icon: 'note' as const,
            onClick: () => window.open(getEventDefinitionUrl(event.name), '_blank'),
        },
        {
            key: 'find-usages',
            label: 'Find usages on Github',
            icon: 'magnifyingGlass' as const,
            onClick: () => window.open(getEventUsagesUrl(event.name), '_blank'),
        },
        {
            key: 'copy-link',
            label: 'Copy link',
            icon: 'copy' as const,
            onClick: handleCopyLink,
        },
    ];

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
                    <Tooltip content={toEventExportName(event.name)}>
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={handleCopyExportNameClick}
                            onKeyDown={handleCopyExportNameKeyDown}
                        >
                            <H3>{event.name}</H3>
                        </span>
                    </Tooltip>
                    <Row gap={4} alignItems="center">
                        <ChangelogButton />

                        <Tooltip content="More actions">
                            <Dropdown items={dropdownItems} iconName="dotsThree" iconSize="small" />
                        </Tooltip>
                        {copied && (
                            <Text intent="brand" priority="primary" typographyStyle="body-xs">
                                Copied to clipboard
                            </Text>
                        )}
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

type EventCardProps = {
    event: EventDoc;
    onEdit?: (event: EventDoc) => void;
};

export const EventCard = ({ event, onEdit }: EventCardProps) => (
    <Card paddingType="small">
        <Header event={event} onEdit={onEdit} />
        <InfoItem label="Trigger" typographyStyle="body-xs">
            <Markdown>{event.descriptionTrigger}</Markdown>
        </InfoItem>
        {event.description && (
            <InfoItem label="Description" typographyStyle="body-xs" margin={{ top: 12 }}>
                <Markdown>{event.description}</Markdown>
            </InfoItem>
        )}
        {event.possibleImprovements && (
            <InfoItem label="Possible improvements" typographyStyle="body-xs" margin={{ top: 12 }}>
                <Markdown>{event.possibleImprovements}</Markdown>
            </InfoItem>
        )}

        <AttributesTable attributes={event.attributes ?? {}} />
    </Card>
);
