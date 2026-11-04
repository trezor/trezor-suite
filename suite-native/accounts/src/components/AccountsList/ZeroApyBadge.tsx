import { Badge } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const ZeroApyBadge = ({ isInformational = false }: { isInformational?: boolean }) => (
    <Badge
        intent={isInformational ? 'info' : 'warning'}
        icon={isInformational ? 'info' : 'warning'}
        size="small"
        label={<Translation id="earn.zeroApyBadge" />}
    />
);
