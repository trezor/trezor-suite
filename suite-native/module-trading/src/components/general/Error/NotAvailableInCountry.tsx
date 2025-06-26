import { Translation } from '@suite-native/intl';

import { WarningCard } from './WarningCard';

export const NotAvailableInCountry = () => (
    <WarningCard title={<Translation id="moduleTrading.error.notAvailableInCountryTitle" />} />
);
