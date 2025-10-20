import { Translation } from '@suite-native/intl';

import { InfoCard } from './InfoCard';

export const ViewOnlyWalletInfo = () => (
    <InfoCard
        title={<Translation id="tradingAtoms.error.viewOnlyWalletTitle" />}
        description={<Translation id="tradingAtoms.error.viewOnlyWalletDescription" />}
    />
);
