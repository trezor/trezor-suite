import type { ReactElement } from 'react';

import { useRouter } from 'next/router';
import { useMounted } from 'nextra/hooks';

import { Anchor } from './anchor';
import { useConfig } from '../contexts/useConfig';
import { getGitIssueUrl } from '../utils/get-git-issue-url';
import { renderComponent } from '../utils/render';

export function NotFoundPage(): ReactElement | null {
    const config = useConfig();
    const mounted = useMounted();
    const { asPath } = useRouter();
    const { content, labels } = config.notFound;
    if (!content) {
        return null;
    }

    return (
        <p className="nx-text-center">
            <Anchor
                href={getGitIssueUrl({
                    repository: config.docsRepositoryBase,
                    title: `Found broken \`${mounted ? asPath : ''}\` link. Please fix!`,
                    labels,
                })}
                newWindow
                className="nx-text-primary-600 nx-underline nx-decoration-from-font [text-underline-position:from-font]"
            >
                {renderComponent(content)}
            </Anchor>
        </p>
    );
}
