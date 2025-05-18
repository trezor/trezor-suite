import { Translation } from '@suite-native/intl';

import { EmptyComponent } from '../EmptyComponent';

export const FiatCurrencyListEmptyComponent = () => (
    <EmptyComponent
        title={<Translation id="moduleTrading.fiatCurrencySheet.emptyTitle" />}
        description={<Translation id="moduleTrading.fiatCurrencySheet.emptyDescription" />}
    />
);
