import { useSelector } from 'react-redux';

import { asNetworkSymbol } from '@suite-common/networks';
import { PROD_STAKING_SYMBOLS, STAKING_SYMBOLS } from '@suite-common/wallet-config';
import { selectAreTestnetsEnabled } from '@suite-native/settings';

export const useStakingPromoList = () => {
    const areTestnetsEnabled = useSelector(selectAreTestnetsEnabled);

    const stakingSymbols = (areTestnetsEnabled ? STAKING_SYMBOLS : PROD_STAKING_SYMBOLS).map(
        asNetworkSymbol,
    );

    return { stakingSymbols };
};
