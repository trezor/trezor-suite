import { Badge, HStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

export const ZeroApyBadge = () => (
    <Badge
        intent="warning"
        icon={
            <HStack spacing="sp4" alignItems="center">
                <Icon name="piggyBank" color="contentWarning" size="medium" />
                <Icon name="warning" color="contentWarning" size="medium" />
            </HStack>
        }
        size="small"
        label={<Translation id="earn.zeroApyBadge" />}
    />
);
