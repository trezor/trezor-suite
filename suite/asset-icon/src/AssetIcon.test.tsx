/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

import { ServicesProvider, mock } from '@suite-common/dependency-injection';
import {
    createNetworkModuleRepository,
    createNetworkModulesCompositionRoot,
    type NetworkIconRegistryDeps,
    createNetworkIconRegistry,
} from '@suite-common/networks';
import { intermediaryTheme } from '@trezor/components';

import { AssetIcon } from './AssetIcon';

jest.mock('react-svg', () => ({
    ReactSVG: ({ src }: { src: string }) => <img src={src} alt="native asset" />,
}));

it('uses the current app repository and responds when the registry changes', () => {
    const networkModules = createNetworkModulesCompositionRoot({ getTrezorConnect: mock() });
    networkModules.cardano.icon = {
        getIcons: () => ({ coin: 'custom.svg', network: 'custom-badge.svg' }),
        getTokenLogoIdentifiers: (_symbol, contract) => [contract],
    };
    const repository = createNetworkModuleRepository({ networkModules });
    const deps: NetworkIconRegistryDeps = {
        networkModuleRepository: { ...repository, getSupportedNetworks: () => ['ada'] },
    };
    const registered = createNetworkIconRegistry(deps);
    const emptyDeps: NetworkIconRegistryDeps = {
        networkModuleRepository: { ...repository, getSupportedNetworks: () => [] },
    };
    const empty = createNetworkIconRegistry(emptyDeps);
    const view = (networkIconRegistry: typeof registered) => (
        <ServicesProvider services={{ networkIconRegistry }}>
            <ThemeProvider theme={{ ...intermediaryTheme.light, variant: 'light' }}>
                <AssetIcon symbol="ada" />
            </ThemeProvider>
        </ServicesProvider>
    );
    const { rerender } = render(view(registered));
    expect(screen.getByRole('img').getAttribute('src')).toBe('custom.svg');
    rerender(view(empty));
    expect(screen.queryByRole('img')).toBeNull();
});
