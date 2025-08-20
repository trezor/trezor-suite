import { useSelector } from 'react-redux';

import { selectSellSupportedFiatCurrenciesList } from '../../../selectors/sellSelectors';
import {
    FiatCurrencySheet,
    FiatCurrencySheetProps,
} from '../../general/FiatCurrencySheet/FiatCurrencySheet';

export type SellFiatCurrencySheetProps = Omit<FiatCurrencySheetProps, 'supportedFiatCurrencies'>;

export const SellFiatCurrencySheet = (props: SellFiatCurrencySheetProps) => {
    const supportedCurrencies = useSelector(selectSellSupportedFiatCurrenciesList);

    return <FiatCurrencySheet {...props} supportedFiatCurrencies={supportedCurrencies} />;
};
