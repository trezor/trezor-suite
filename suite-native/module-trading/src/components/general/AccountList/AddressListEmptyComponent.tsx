import { Translation } from '@suite-native/intl';

import { EmptyComponent } from '../EmptyComponent';

export const AddressListEmptyComponent = () => (
    <EmptyComponent
        title={<Translation id="moduleTrading.accountScreen.addressEmpty.title" />}
        description={<Translation id="moduleTrading.accountScreen.addressEmpty.description" />}
    />
);
