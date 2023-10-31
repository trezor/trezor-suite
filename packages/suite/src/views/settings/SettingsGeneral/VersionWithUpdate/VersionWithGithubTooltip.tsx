import styled, { css } from 'styled-components';

import { Button, Tooltip, Link } from '@trezor/components';
import { getReleaseUrl } from 'src/services/github';
import { Translation } from 'src/components/suite';

const VersionTooltip = styled(Tooltip)`
    display: inline-flex;
    margin-left: 5px;
    margin-right: 5px;
`;

const VersionButton = styled(Button)<{ isDev?: boolean }>`
    ${({ isDev }) =>
        isDev &&
        css`
            color: ${({ theme }) => theme.TYPE_WHITE};
            background: ${({ theme }) => theme.BUTTON_RED};

            :hover,
            :active,
            :focus {
                background: ${({ theme }) => theme.BUTTON_RED_HOVER};
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
        cursor="pointer"
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
            <VersionButton
                size="small"
                variant="tertiary"
                icon="EXTERNAL_LINK"
                iconAlignment="right"
                isDev={isDev}
            >
                {appVersion}
                {isDev && '-dev'}
            </VersionButton>
        </Link>
    </VersionTooltip>
);
