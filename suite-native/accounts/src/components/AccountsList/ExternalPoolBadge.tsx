import { Badge } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type ExternalPoolBadgeProps = {
    showStakingIcon?: boolean;
};

export const ExternalPoolBadge = ({ showStakingIcon }: ExternalPoolBadgeProps) => (
    <Badge
        intent="info"
        icon={showStakingIcon ? 'piggyBank' : 'info'}
        size="small"
        label={<Translation id="accountList.externalPool" />}
    />
);
