import { type NetworkSymbol } from '@trezor/network-module-types';

import { getMockNetworkMetadata } from './mockNetworkMetadata';
import {
    type NetworksState,
    networksActions,
    networksReducer,
} from '../reduxState/networksReducer';

/**
 * Takes the open symbol, so a test does not have to prove its symbols are mocked in the type.
 * A symbol without mock metadata throws here instead of silently seeding `undefined`.
 */
export const mockNetworksState = (symbols: readonly NetworkSymbol[]): NetworksState =>
    networksReducer(null, networksActions.setNetworks(symbols.map(getMockNetworkMetadata)));
