import { act, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

import { Markdown } from './Markdown';
import { intermediaryTheme } from '../../config/colors';

const mockChunkLoad = { shouldFail: false, attempts: 0 };

jest.mock('react-markdown', () => {
    mockChunkLoad.attempts++;
    if (mockChunkLoad.shouldFail) {
        throw new Error('Loading chunk react-markdown failed');
    }

    return jest.requireActual('react-markdown');
});

const settleLoad = () => act(() => new Promise(resolve => setTimeout(resolve, 0)));

const markdownTree = (markdown: string) => (
    <ThemeProvider theme={{ ...intermediaryTheme.light, variant: 'light' }}>
        <Markdown
            components={{
                a: ({ children, href }) => <a href={`${href}#custom`}>{children}</a>,
            }}
        >
            {markdown}
        </Markdown>
    </ThemeProvider>
);

const renderMarkdown = (markdown: string) => render(markdownTree(markdown));

describe('Markdown', () => {
    // Loads the real module once, past the mock and outside any findBy: on a cold, busy runner its
    // first load adds to React's 300 ms Suspense reveal throttle and can push past the 1 s timeout.
    beforeAll(() => {
        jest.requireActual('react-markdown');
    }, 30_000);

    // Runs first: once react-markdown has loaded, the module registry keeps it and no load fails again.
    it('loads react-markdown once per mount when it fails, however often it re-renders with new props', async () => {
        mockChunkLoad.shouldFail = true;
        const attemptsBefore = mockChunkLoad.attempts;
        const { rerender, unmount } = renderMarkdown('## Version 1');
        await settleLoad();

        for (const version of ['2', '3', '4']) {
            rerender(markdownTree(`## Version ${version}`));
            await settleLoad();
        }

        expect(screen.getByText('## Version 4')).toBeInTheDocument();
        expect(mockChunkLoad.attempts - attemptsBefore).toBe(1);
        unmount();
    });

    it('shows the source as plain text when react-markdown fails to load, and loads it again on the next mount', async () => {
        mockChunkLoad.shouldFail = true;
        const { unmount } = renderMarkdown('## Release notes');
        await settleLoad();

        expect(screen.getByText('## Release notes')).toBeInTheDocument();
        unmount();

        mockChunkLoad.shouldFail = false;
        renderMarkdown('## Release notes');
        await settleLoad();

        expect(
            screen.getByRole('heading', { level: 2, name: 'Release notes' }),
        ).toBeInTheDocument();
    });

    it('renders the parsed markdown with custom components once react-markdown has loaded', async () => {
        renderMarkdown('## Release notes\n\n- [Changelog](https://trezor.io)');

        expect(
            await screen.findByRole('heading', { level: 2, name: 'Release notes' }),
        ).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Changelog' })).toHaveAttribute(
            'href',
            'https://trezor.io#custom',
        );
    });
});
