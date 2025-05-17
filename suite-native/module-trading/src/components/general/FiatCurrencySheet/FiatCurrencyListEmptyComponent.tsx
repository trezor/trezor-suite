import { Translation } from '@suite-native/intl';

import { TradingEmptyComponent } from '../EmptyComponent';

export const FiatCurrencyListEmptyComponent = () => (
    <TradingEmptyComponent
        title={<Translation id="moduleTrading.fiatCurrencySheet.emptyTitle" />}
        description={<Translation id="moduleTrading.fiatCurrencySheet.emptyDescription" />}
    />
);
