import { Translation } from '@suite-native/intl';

import { InfoCard } from './InfoCard';

export const PortfolioTrackerInfo = () => (
    <InfoCard
        title={<Translation id="moduleTrading.error.portfolioTrackerTitle" />}
        description={<Translation id="moduleTrading.error.portfolioTrackerDescription" />}
    />
);
