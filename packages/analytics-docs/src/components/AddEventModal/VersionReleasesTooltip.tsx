import type { ReactNode } from 'react';

import { Column, Icon, Link, Row, Text, Tooltip } from '@trezor/components';
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
                <Text typographyStyle="body-sm" color="textPrimary">
                    Latest released:
                </Text>
                <Row gap={8} flexWrap="wrap">
                    {desktop && (
                        <Text typographyStyle="body-sm">
                            Desktop <strong>{desktop}</strong>
                        </Text>
                    )}
                    {desktop && mobile && (
                        <Text typographyStyle="body-sm" color="textSubdued">
                            •
                        </Text>
                    )}
                    {mobile && (
                        <Text typographyStyle="body-sm">
                            Mobile <strong>{mobile}</strong>
                        </Text>
                    )}
                </Row>
                <Link href={RELEASES_URL} target="_blank" typographyStyle="body-sm">
                    View all releases
                </Link>
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
