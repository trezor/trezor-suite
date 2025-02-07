import { Translation } from '@suite-native/intl';

import { TradingEmptyComponent } from '../TradingEmptyComponent';

export const AddressListEmptyComponent = () => (
    <TradingEmptyComponent
        title={<Translation id="moduleTrading.accountSheet.addressEmptyTitle" />}
        description={<Translation id="moduleTrading.accountSheet.addressEmptyDescription" />}
    />
);
