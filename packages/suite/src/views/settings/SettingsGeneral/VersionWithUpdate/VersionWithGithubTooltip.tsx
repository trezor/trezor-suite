import styled from 'styled-components';

import { Button, Tooltip, Link } from '@trezor/components';
import { getReleaseUrl } from 'src/services/github';
import { Translation } from 'src/components/suite';

const VersionTooltip = styled(Tooltip)`
    display: inline-flex;
    margin-left: 5px;
    margin-right: 5px;
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
            <Button size="tiny" variant="destructive" icon="EXTERNAL_LINK" iconAlignment="right">
                {appVersion}
                {isDev && '-dev'}
            </Button>
        </Link>
    </VersionTooltip>
);
