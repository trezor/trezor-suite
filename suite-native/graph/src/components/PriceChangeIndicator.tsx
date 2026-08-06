import { PriceChangeBadge } from '@suite-native/atoms';

type PriceChangeIndicatorProps = {
    percentageChange: number;
};

export const PriceChangeIndicator = ({ percentageChange }: PriceChangeIndicatorProps) => (
    <PriceChangeBadge valuePercentageChange={percentageChange} />
);
