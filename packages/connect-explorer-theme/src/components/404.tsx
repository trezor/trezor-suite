import type { ReactElement } from 'react';

import { useRouter } from 'next/router';
import { useMounted } from 'nextra/hooks';

import { Anchor } from './anchor';
import { useThemeConfig } from '../contexts/theme-config';
import { getGitIssueUrl } from '../utils/get-git-issue-url';
import { renderComponent } from '../utils/render';

export function NotFoundPage(): ReactElement | null {
    const themeConfig = useThemeConfig();
    const mounted = useMounted();
    const { asPath } = useRouter();
    const { content, labels } = themeConfig.notFound;
    if (!content) {
        return null;
    }

    return (
        <p className="_text-center">
            <Anchor
                href={getGitIssueUrl({
                    repository: themeConfig.docsRepositoryBase,
                    title: `Found broken \`${mounted ? asPath : ''}\` link. Please fix!`,
                    labels,
                })}
                newWindow
                className="_text-primary-600 _underline _decoration-from-font [text-underline-position:from-font]"
            >
                {renderComponent(content)}
            </Anchor>
        </p>
    );
}
