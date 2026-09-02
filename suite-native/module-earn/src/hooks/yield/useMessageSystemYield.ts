import { useSelector } from 'react-redux';

import { useMessageSystemYield as useMessageSystemYieldCore } from '@suite-common/message-system';
import { type YieldFlowType } from '@suite-common/wallet-core';
import { selectLocale } from '@suite-native/intl';

type UseMessageSystemYieldOptions = {
    vaultContractAddress?: string | null;
};

export const useMessageSystemYield = (
    type: YieldFlowType,
    options: UseMessageSystemYieldOptions = {},
) => {
    const locale = useSelector(selectLocale);
    const { vaultContractAddress } = options;

    return useMessageSystemYieldCore({ type, vaultContractAddress, locale });
};
