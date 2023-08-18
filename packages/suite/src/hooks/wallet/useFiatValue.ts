import { selectCoinsLegacy } from '@suite-common/wallet-core';
import { useSelector } from 'src/hooks/suite';

// TODO: do the calculation here
export const useFiatValue = () => {
    const coins = useSelector(selectCoinsLegacy);
    const localCurrency = useSelector(state => state.wallet.settings.localCurrency);

    return {
        coins,
        localCurrency,
    };
};
