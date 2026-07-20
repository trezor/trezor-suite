import { type EarnDashboardType } from '@suite-common/message-system';
import { Box, InlineAlertBox } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { EarnPromoListRowContainer } from './EarnPromoListRow';
import { useMessageSystemEarnDashboard } from '../hooks/useMessageSystemEarnDashboard';

type EarnDashboardDisabledRowProps = {
    type: EarnDashboardType;
    isLastInSection: boolean;
};

export const EarnDashboardDisabledRow = ({
    type,
    isLastInSection,
}: EarnDashboardDisabledRowProps) => {
    const { content, variant } = useMessageSystemEarnDashboard(type);

    return (
        <EarnPromoListRowContainer isLastInSection={isLastInSection}>
            <Box padding="sp16">
                <InlineAlertBox
                    intent={variant ?? 'warning'}
                    title={content ?? <Translation id="earn.notAvailable" />}
                />
            </Box>
        </EarnPromoListRowContainer>
    );
};
