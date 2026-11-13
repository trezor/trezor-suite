import type { NetworkFamilyId } from '@suite-common/networks';

import type { SendOptionPanels } from './sendOptionPanels';
import { EthereumNoncePanel } from '../EthereumOptions/EthereumNoncePanel';

/** The families whose send option panels the desktop app presents its own way. */
export const sendOptionsOverrides: Readonly<
    Partial<Record<NetworkFamilyId, Partial<SendOptionPanels>>>
> = {
    ethereum: { NoncePanel: EthereumNoncePanel },
};
