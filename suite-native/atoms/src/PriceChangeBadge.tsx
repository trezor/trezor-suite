import { type IconName } from '@suite-native/icons';

import { Badge, type BadgeIntent } from './Badge';
import { BoxSkeleton } from './Skeleton/BoxSkeleton';

export type PriceChangeBadgeProps = {
    valuePercentageChange: number | null;
};

const percentFormatter = new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumSignificantDigits: 3,
    minimumSignificantDigits: 3,
});

export const PriceChangeBadge = ({ valuePercentageChange }: PriceChangeBadgeProps) => {
    const percentageChange = valuePercentageChange ?? 0;
    const priceHasIncreased = percentageChange >= 0;

    const icon: IconName = priceHasIncreased ? 'caretUpFilled' : 'caretDownFilled';
    const badgeVariant: BadgeIntent = priceHasIncreased ? 'brand' : 'critical';
    const formattedPercentage = percentFormatter.format(percentageChange);

    if (valuePercentageChange == null) {
        return <BoxSkeleton width={70} height={24} borderRadius={12} />;
    }

    return <Badge icon={icon} size="medium" intent={badgeVariant} label={formattedPercentage} />;
};
