import { useSelector } from 'react-redux';

import { selectBuySupportedFiatCurrenciesList } from '../../selectors/buySelectors';
import {
    FiatCurrencySheet,
    FiatCurrencySheetProps,
} from '../general/FiatCurrencySheet/FiatCurrencySheet';

export type BuyFiatCurrencySheetProps = Omit<FiatCurrencySheetProps, 'supportedFiatCurrencies'>;

export const BuyFiatCurrencySheet = (props: BuyFiatCurrencySheetProps) => {
    const supportedCurrencies = useSelector(selectBuySupportedFiatCurrenciesList);

    return <FiatCurrencySheet {...props} supportedFiatCurrencies={supportedCurrencies} />;
};
