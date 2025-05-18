import { Translation } from '@suite-native/intl';

import { EmptyComponent } from '../EmptyComponent';

export const CountryListEmptyComponent = () => (
    <EmptyComponent
        title={<Translation id="moduleTrading.countrySheet.emptyTitle" />}
        description={<Translation id="moduleTrading.countrySheet.emptyDescription" />}
    />
);
