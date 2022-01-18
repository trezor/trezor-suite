import React from 'react';
import styled, { css } from 'styled-components';

import { Button, Tooltip, Link } from '@trezor/components';
import { getReleaseUrl } from '@suite/services/github';
import { Translation } from '@suite-components';

const VersionTooltip = styled(Tooltip)`
    display: inline-flex;
    margin: 0 4px;
`;

const VersionButton = styled(Button)<{ isDev?: boolean }>`
    padding-left: 1ch;
    ${props =>
        props.isDev &&
        css`
            color: ${props => props.theme.TYPE_WHITE};
            background: ${props => props.theme.BUTTON_RED};
            &:hover,
            &:active,
            &:focus {
                background: ${props => props.theme.BUTTON_RED_HOVER};
            }
        `};
`;

const GithubWrapper = styled.div`
    display: flex;
    justify-content: space-between;
`;

type VersionWithGithubTooltipProps = { appVersion: string; isDev?: boolean };

export const VersionWithGithubTooltip = ({ appVersion, isDev }: VersionWithGithubTooltipProps) => (
    <VersionTooltip
        content={
            <GithubWrapper>
                <Link variant="nostyle" href={getReleaseUrl(appVersion)}>
                    <Button variant="tertiary" icon="GITHUB">
                        <Translation id="TR_CHANGELOG_ON_GITHUB" />
                    </Button>
                </Link>
            </GithubWrapper>
        }
    >
        <Link href={getReleaseUrl(appVersion)}>
            <VersionButton variant="tertiary" icon="EXTERNAL_LINK" alignIcon="right" isDev={isDev}>
                {appVersion}
                {isDev && '-dev'}
            </VersionButton>
        </Link>
    </VersionTooltip>
);
