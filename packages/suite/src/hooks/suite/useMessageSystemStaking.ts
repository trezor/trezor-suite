import { selectLanguage } from '@suite/settings';
import { useMessageSystemStaking as useMessageSystemStakingCore } from '@suite-common/message-system';
import { useSelector } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';

export const useMessageSystemStaking = (networkSymbol?: NetworkSymbol) => {
    const locale = useSelector(selectLanguage);

    return useMessageSystemStakingCore({ networkSymbol, locale });
};
