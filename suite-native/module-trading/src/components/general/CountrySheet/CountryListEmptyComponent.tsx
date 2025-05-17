import { Translation } from '@suite-native/intl';

import { TradingEmptyComponent } from '../EmptyComponent';

export const CountryListEmptyComponent = () => (
    <TradingEmptyComponent
        title={<Translation id="moduleTrading.countrySheet.emptyTitle" />}
        description={<Translation id="moduleTrading.countrySheet.emptyDescription" />}
    />
);
