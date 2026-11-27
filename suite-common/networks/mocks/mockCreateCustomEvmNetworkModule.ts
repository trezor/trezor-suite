import { mock } from '@trezor/dependency-injection';

import { mockNetworkModule } from './mockNetworkModule';
import type { CreateCustomEvmNetworkModule } from '../src/CreateCustomEvmNetworkModule';

export const mockCreateCustomEvmNetworkModule = () =>
    mock<CreateCustomEvmNetworkModule>(({ symbol, config }) =>
        mockNetworkModule({
            getSupportedNetworks: () => [symbol],
            getNetworkConfig: () => config,
        }),
    );
