import { selectLanguage } from '@suite/settings';
import { useMessageSystemStaking as useMessageSystemStakingCore } from '@suite-common/message-system';
import { type NetworkSymbol } from '@suite-common/wallet-config';

import { useSelector } from './useSelector';

export const useMessageSystemStaking = (networkSymbol?: NetworkSymbol) => {
    const locale = useSelector(selectLanguage);

    return useMessageSystemStakingCore({ networkSymbol, locale });
};
