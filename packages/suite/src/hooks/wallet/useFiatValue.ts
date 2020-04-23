import { useSelector } from 'react-redux';
import { AppState } from '@suite-types';

// TODO: do the calculation here
export const useFiatValue = () => {
    const fiat = useSelector<AppState, AppState['wallet']['fiat']>(state => state.wallet.fiat);
    const localCurrency = useSelector<AppState, string>(
        state => state.wallet.settings.localCurrency,
    );

    return {
        fiat,
        localCurrency,
    };
};
