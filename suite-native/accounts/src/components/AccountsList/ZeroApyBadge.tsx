import { Badge } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const ZeroApyBadge = () => (
    <Badge
        intent="warning"
        icon="warning"
        size="small"
        label={<Translation id="earn.zeroApyBadge" />}
    />
);
