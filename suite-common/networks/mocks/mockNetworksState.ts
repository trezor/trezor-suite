import { mockNetworkMetadata } from './mockNetworkMetadata';
import {
    type NetworksState,
    networksActions,
    networksReducer,
} from '../reduxState/networksReducer';

export const mockNetworksState = (
    symbols: readonly (keyof typeof mockNetworkMetadata)[],
): NetworksState =>
    networksReducer(
        null,
        networksActions.setNetworks(symbols.map(symbol => mockNetworkMetadata[symbol])),
    );
