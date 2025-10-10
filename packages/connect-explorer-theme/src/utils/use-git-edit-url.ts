import gitUrlParse from 'git-url-parse';

import { useConfig } from '../contexts/config';

export function useGitEditUrl(filePath = ''): string {
    const config = useConfig();
    const repo = gitUrlParse(config.docsRepositoryBase || '');

    if (!repo) throw new Error('Invalid `docsRepositoryBase` URL!');

    return `${repo.href}/${filePath}`;
}
