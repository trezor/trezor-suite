import { selectLanguage } from '@suite/settings';
import { useMessageSystemYield as useMessageSystemYieldCore } from '@suite-common/message-system';
import type { YieldFlowType } from '@suite-common/wallet-core';

import { useSelector } from './useSelector';

type UseMessageSystemYieldOptions = {
    vaultContractAddress?: string | null;
};

export const useMessageSystemYield = (
    type: YieldFlowType,
    options: UseMessageSystemYieldOptions = {},
) => {
    const locale = useSelector(selectLanguage);
    const { vaultContractAddress } = options;

    return useMessageSystemYieldCore({ type, vaultContractAddress, locale });
};
