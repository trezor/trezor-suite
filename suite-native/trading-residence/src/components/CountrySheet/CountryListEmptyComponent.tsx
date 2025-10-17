import { Translation } from '@suite-native/intl';
import { EmptyComponent } from '@suite-native/trading-atoms';

export const CountryListEmptyComponent = () => (
    <EmptyComponent
        title={<Translation id="tradingResidence.countrySheet.emptyTitle" />}
        description={<Translation id="tradingResidence.countrySheet.emptyDescription" />}
    />
);
