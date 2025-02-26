import { Translation } from '@suite-native/intl';

import { TradingEmptyComponent } from '../TradingEmptyComponent';

export const AddressListEmptyComponent = () => (
    <TradingEmptyComponent
        title={<Translation id="moduleTrading.accountScreen.addressEmpty.title" />}
        description={<Translation id="moduleTrading.accountScreen.addressEmpty.description" />}
    />
);
