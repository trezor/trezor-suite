import { Translation } from '@suite-native/intl';

import { InfoCard } from './InfoCard';

export const ViewOnlyWalletInfo = () => (
    <InfoCard
        title={<Translation id="moduleTrading.error.viewOnlyWalletTitle" />}
        description={<Translation id="moduleTrading.error.viewOnlyWalletDescription" />}
    />
);
