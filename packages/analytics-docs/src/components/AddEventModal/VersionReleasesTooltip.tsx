import type { ReactNode } from 'react';

import { Column, Icon, InfoItem, Link, Paragraph, Row, Text, Tooltip } from '@trezor/components';
import { zIndices } from '@trezor/theme';

import { useLatestReleases } from '../../utils/useLatestReleases';

const RELEASES_URL = 'https://github.com/trezor/trezor-suite/releases';

export const VersionReleasesTooltip = () => {
    const { desktop, mobile, isLoading, error } = useLatestReleases();

    let content: ReactNode = null;
    if (isLoading || error) {
        content = (
            <Text typographyStyle="body-sm">
                {isLoading ? 'Loading…' : 'Could not load latest releases.'}
            </Text>
        );
    } else if (desktop ?? mobile) {
        content = (
            <Column gap={4}>
                <Paragraph typographyStyle="body-sm-strong">
                    Latest releases (
                    <Link href={RELEASES_URL} target="_blank" typographyStyle="body-sm">
                        show all
                    </Link>
                    )
                </Paragraph>
                <Row gap={20} margin={{ bottom: 8 }}>
                    {desktop && (
                        <InfoItem label="Desktop">
                            <strong>{desktop}</strong>
                        </InfoItem>
                    )}
                    {mobile && (
                        <InfoItem label="Mobile">
                            <strong>{mobile}</strong>
                        </InfoItem>
                    )}
                </Row>
            </Column>
        );
    }

    if (!content) return null;

    return (
        <Tooltip
            content={content}
            placement="top"
            tooltipMaxWidth={280}
            appendTo={document.body}
            zIndex={zIndices.windowControls}
        >
            <Icon name="question" size={16} priority="secondary" cursor="help" />
        </Tooltip>
    );
};
