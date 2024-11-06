import { Badge, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useLayoutSize } from 'src/hooks/suite';

export const DefaultTag = () => {
    const { isMobileLayout } = useLayoutSize();

    return (
        <Badge
            variant="primary"
            inline
            margin={{ left: spacings.xs }}
            size={isMobileLayout ? 'tiny' : undefined}
        >
            <Text typographyStyle="hint">
                <Translation id="TR_ONBOARDING_BACKUP_TYPE_DEFAULT" />
            </Text>
        </Badge>
    );
};
