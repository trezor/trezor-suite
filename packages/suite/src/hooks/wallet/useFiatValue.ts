import { useSelector } from 'src/hooks/suite';

// TODO: do the calculation here
export const useFiatValue = () => {
    const fiat = useSelector(state => state.wallet.fiat);
    const localCurrency = useSelector(state => state.wallet.settings.localCurrency);

    return {
        fiat,
        localCurrency,
    };
};
