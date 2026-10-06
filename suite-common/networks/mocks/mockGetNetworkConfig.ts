import { mockNetworkMetadata } from './mockNetworkMetadata';
import type { GetNetworkConfig } from '../src/createGetNetworkConfig';

export const mockGetNetworkConfig: GetNetworkConfig = () => ({
    ...mockNetworkMetadata.btc,
    color: '#000000',
    protocols: [],
});
