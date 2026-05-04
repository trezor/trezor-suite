import type { ReactElement } from 'react';

import { useRouter } from 'next/router';
import { useMounted } from 'nextra/hooks';

import { Anchor } from './anchor';
import { useThemeConfig } from '../contexts/theme-config';
import { getGitIssueUrl } from '../utils/get-git-issue-url';
export function ServerSideErrorPage(): ReactElement | null {
    const themeConfig = useThemeConfig();
    const mounted = useMounted();
    const { asPath } = useRouter();

    // serverSideError was removed in nextra v3; use notFound as fallback
    const content = 'Submit an issue about error in url →';
    const labels = 'bug';

    return (
        <p className="_text-center">
            <Anchor
                href={getGitIssueUrl({
                    repository: themeConfig.docsRepositoryBase,
                    title: `Got server-side error in \`${mounted ? asPath : ''}\` url. Please fix!`,
                    labels,
                })}
                newWindow
                className="_text-primary-600 _underline _decoration-from-font [text-underline-position:from-font]"
            >
                {content}
            </Anchor>
        </p>
    );
}
