import { Translation } from '@suite-native/intl';
import { EmptyComponent } from '@suite-native/trading-atoms';

export const AddressListEmptyComponent = () => (
    <EmptyComponent
        title={<Translation id="moduleTrading.accountScreen.addressEmpty.title" />}
        description={<Translation id="moduleTrading.accountScreen.addressEmpty.description" />}
    />
);
