import { Badge, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite/Translation';
import { useLayoutSize } from 'src/hooks/suite';

export const DefaultTag = () => {
    const { isBelowTablet } = useLayoutSize();

    return (
        <Badge
            intent="brand"
            margin={{ left: spacings.xs }}
            size={isBelowTablet ? 'small' : undefined}
        >
            <Text typographyStyle="hint">
                <Translation id="TR_ONBOARDING_BACKUP_TYPE_DEFAULT" />
            </Text>
        </Badge>
    );
};
