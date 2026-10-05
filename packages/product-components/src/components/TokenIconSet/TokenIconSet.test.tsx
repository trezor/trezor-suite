/** @jest-environment jsdom */

import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

import { intermediaryTheme } from '@trezor/components';
import { ServicesProvider } from '@trezor/dependency-injection';
import { type NetworkConfigState, asNetworkSymbol } from '@trezor/network-module-types';

import { TokenIconSet } from './TokenIconSet';
import type { ProductComponentsServices } from '../../services/ProductComponentsServices';
import { storyServices } from '../TokenIcon/storyFixtures';

type ReactSVGProps = { src: string };
jest.mock('react-svg', () => ({
    ReactSVG: ({ src }: ReactSVGProps) => <img src={src} alt="native asset" />,
}));

it('uses the configured settlement layer for native icons in an L2 token set', () => {
    const ethereum = asNetworkSymbol('eth');
    const base = asNetworkSymbol('base');
    const state: NetworkConfigState = {
        networks: {
            [ethereum]: { name: 'Ethereum' },
            [base]: { name: 'Base', settlementLayer: ethereum },
        },
    };
    const services: ProductComponentsServices = {
        ...storyServices,
        networks: {
            networkIcon: {
                ...storyServices.networks.networkIcon,
                getCryptoIcon: jest.fn(symbol => `${symbol}.svg`),
            },
        },
    };

    const store = configureStore({ reducer: () => state });

    render(
        <Provider store={store}>
            <ServicesProvider services={services}>
                <ThemeProvider theme={{ ...intermediaryTheme.light, variant: 'light' }}>
                    <TokenIconSet
                        symbol={base}
                        tokens={[{ networkSymbol: base }]}
                        size={32}
                        gap={8}
                    />
                </ThemeProvider>
            </ServicesProvider>
        </Provider>,
    );

    expect(services.networks.networkIcon.getCryptoIcon).toHaveBeenCalledWith(ethereum);
    expect(screen.getByRole('img').getAttribute('src')).toBe('eth.svg');
});
