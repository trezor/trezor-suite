import { Translation } from '@suite/intl';
import { Badge, Text } from '@trezor/components';

import { useLayoutSize } from 'src/hooks/suite';

export const DefaultTag = () => {
    const { isBelowTablet } = useLayoutSize();

    return (
        <Badge intent="brand" margin={{ left: 8 }} size={isBelowTablet ? 'small' : undefined}>
            <Text typographyStyle="body-sm">
                <Translation id="TR_ONBOARDING_BACKUP_TYPE_DEFAULT" />
            </Text>
        </Badge>
    );
};
