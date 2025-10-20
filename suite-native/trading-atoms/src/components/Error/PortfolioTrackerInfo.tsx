import { Translation } from '@suite-native/intl';

import { InfoCard } from './InfoCard';

export const PortfolioTrackerInfo = () => (
    <InfoCard
        title={<Translation id="tradingAtoms.error.portfolioTrackerTitle" />}
        description={<Translation id="tradingAtoms.error.portfolioTrackerDescription" />}
    />
);
