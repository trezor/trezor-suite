import { mockNetworkConfigDeps } from './mockNetworkConfigDeps';
import {
    type NetworksState,
    networksActions,
    networksReducer,
} from '../reduxState/networksReducer';
import { type NetworkSymbol } from '../src/NetworkModules';

export const mockNetworksState = (symbols: readonly NetworkSymbol[]): NetworksState =>
    networksReducer(
        null,
        networksActions.setNetworks(symbols.map(mockNetworkConfigDeps().getNetworkConfig)),
    );
