import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

import { intermediaryTheme } from '@trezor/components';

import { TokenIcon } from './TokenIcon';
import { failedAddressesCache, resolvedLogoCache } from './tokenIconUtils';

beforeEach(() => {
    failedAddressesCache.clear();
    resolvedLogoCache.clear();
});

it('renders supplied sources without network data or a store', () => {
    render(
        <ThemeProvider theme={{ ...intermediaryTheme.light, variant: 'light' }}>
            <TokenIcon
                sources={[
                    { src: 'https://example.com/custom-chain/custom-token' },
                    { src: 'https://example.com/custom-chain/native' },
                ]}
                placeholder="CUSTOM"
            />
        </ThemeProvider>,
    );

    expect(screen.getByRole('img').getAttribute('src')).toContain('custom-chain');
    expect(screen.getByRole('img').getAttribute('src')).toContain('custom-token');
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByRole('img').getAttribute('src')).not.toContain('custom-token');
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByText('C')).toBeTruthy();
});

it('tries caller-supplied alternative sources in order', () => {
    render(
        <ThemeProvider theme={{ ...intermediaryTheme.light, variant: 'light' }}>
            <TokenIcon
                sources={[
                    { src: 'https://example.com/first-address' },
                    { src: 'https://example.com/second-address' },
                ]}
                placeholder="CUSTOM"
            />
        </ThemeProvider>,
    );

    expect(screen.getByRole('img').getAttribute('src')).toContain('first-address');
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByRole('img').getAttribute('src')).toContain('second-address');
});
