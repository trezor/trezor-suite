import gitUrlParse from 'git-url-parse';

import { useThemeConfig } from '../contexts/theme-config';

export function useGitEditUrl(filePath = ''): string {
    const themeConfig = useThemeConfig();
    const repo = gitUrlParse(themeConfig.docsRepositoryBase || '');

    if (!repo) throw new Error('Invalid `docsRepositoryBase` URL!');

    return `${repo.href}/${filePath}`;
}
