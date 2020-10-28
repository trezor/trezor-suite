import { useSelector } from '@suite-hooks';

// TODO: do the calculation here
export const useFiatValue = () => {
    const { fiat, localCurrency } = useSelector(state => ({
        fiat: state.wallet.fiat,
        localCurrency: state.wallet.settings.localCurrency,
    }));
    return {
        fiat,
        localCurrency,
    };
};
