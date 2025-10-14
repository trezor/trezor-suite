import { Translation } from '@suite-native/intl';

import { InfoCard } from './InfoCard';

export type PortfolioTrackerInfoProps = {
    testID?: string;
};

export const PortfolioTrackerInfo = ({ testID }: PortfolioTrackerInfoProps) => (
    <InfoCard
        title={<Translation id="tradingAtoms.error.portfolioTrackerTitle" />}
        description={<Translation id="tradingAtoms.error.portfolioTrackerDescription" />}
        testID={testID}
    />
);
