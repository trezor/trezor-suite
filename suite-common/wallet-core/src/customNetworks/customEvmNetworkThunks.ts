import type { CustomEvmNetworkDefinition } from '@suite-common/wallet-types';
import { createThunk } from '@trezor/redux-utils';

import type { WalletCoreCompoundRootState } from '../selectors';

const CUSTOM_EVM_NETWORKS_MODULE_PREFIX = '@common/wallet-core/custom-evm-networks';

// Contract stub: implemented by the registry/persistence part of the feature.
export const addCustomEvmNetworkThunk = createThunk<
    CustomEvmNetworkDefinition,
    { definition: CustomEvmNetworkDefinition },
    { state: WalletCoreCompoundRootState; rejectValue: string }
>(`${CUSTOM_EVM_NETWORKS_MODULE_PREFIX}/addCustomEvmNetworkThunk`, ({ definition }) => definition);

// Contract stub: implemented by the registry/persistence part of the feature.
export const removeCustomEvmNetworkThunk = createThunk<
    void,
    { symbol: CustomEvmNetworkDefinition['symbol'] },
    { state: WalletCoreCompoundRootState }
>(`${CUSTOM_EVM_NETWORKS_MODULE_PREFIX}/removeCustomEvmNetworkThunk`, () => {});
