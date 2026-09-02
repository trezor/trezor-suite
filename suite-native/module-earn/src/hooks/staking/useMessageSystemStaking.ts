import { useSelector } from 'react-redux';

import { useMessageSystemStaking as useMessageSystemStakingCore } from '@suite-common/message-system';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectLocale } from '@suite-native/intl';

export const useMessageSystemStaking = (networkSymbol?: NetworkSymbol | null) => {
    const locale = useSelector(selectLocale);

    return useMessageSystemStakingCore({ networkSymbol, locale });
};
