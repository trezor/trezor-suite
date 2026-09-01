import { selectLanguage } from '@suite/settings';
import { useMessageSystemYield as useMessageSystemYieldCore } from '@suite-common/message-system';
import type { YieldFlowType } from '@suite-common/wallet-core';

import { useSelector } from 'src/hooks/suite';

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
