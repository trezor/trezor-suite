import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';

import { createAssetId } from '@suite-common/asset-types';
import { getMockNetworkMetadata } from '@suite-common/networks/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import { AssetSymbol } from './AssetSymbol';

describe('AssetSymbol', () => {
    it('reads the native ticker from network state using the asset identity', () => {
        const networkSymbol = asNetworkSymbol('base');
        const networks = {
            [networkSymbol]: {
                ...getMockNetworkMetadata(networkSymbol),
                displaySymbol: 'STATE_ETH',
            },
        };
        const store = configureStore({ reducer: () => ({ networks }) });

        render(
            <Provider store={store}>
                <AssetSymbol assetId={createAssetId({ networkSymbol })} />
            </Provider>,
        );

        expect(screen.getByText('STATE_ETH')).toBeTruthy();
    });
});
