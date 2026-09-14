import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

import { intermediaryTheme } from '@trezor/components';

import { TokenIcon } from './TokenIcon';
import { failedAddressesCache, resolvedLogoCache } from './tokenIconUtils';

beforeEach(() => {
    failedAddressesCache.clear();
    resolvedLogoCache.clear();
});

it('renders a supplied logo identifier and address for an unknown network without a store', () => {
    render(
        <ThemeProvider theme={{ ...intermediaryTheme.light, variant: 'light' }}>
            <TokenIcon
                symbol="custom-network"
                coingeckoId="custom-chain"
                contractAddresses={['custom-token']}
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

it('tries caller-supplied alternative logo addresses before the network fallback', () => {
    render(
        <ThemeProvider theme={{ ...intermediaryTheme.light, variant: 'light' }}>
            <TokenIcon
                symbol="custom-network"
                coingeckoId="custom-chain"
                contractAddresses={['first-address', 'second-address']}
                placeholder="CUSTOM"
            />
        </ThemeProvider>,
    );

    expect(screen.getByRole('img').getAttribute('src')).toContain('first-address');
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByRole('img').getAttribute('src')).toContain('second-address');
});
