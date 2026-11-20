import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

import { BlurUrls } from './BlurUrls';
import { intermediaryTheme } from '../../config/colors';

describe('BlurUrls', () => {
    it.each([
        { text: 'trezor.io ledger.com', urls: ['trezor.io', 'ledger.com'] },
        { text: 't.me/reward - Visit to claim', urls: ['t.me/reward'] },
        { text: 'A token without a URL', urls: [] },
    ])('preserves text order and blurs only URLs in "$text"', ({ text, urls }) => {
        const { container } = render(
            <ThemeProvider theme={{ ...intermediaryTheme.light, variant: 'light' }}>
                <BlurUrls text={text} tooltipContent="Unrecognized token URL" />
            </ThemeProvider>,
        );

        expect(container.textContent).toBe(text);
        urls.forEach(url => {
            expect(screen.getByText(url)).toHaveStyle({ filter: 'blur(3px)' });
        });
        if (urls.length === 0) {
            expect(container.childElementCount).toBe(0);
        }
    });
});
