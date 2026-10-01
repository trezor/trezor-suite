import { Translation } from '@suite/intl';
import { Banner, Text } from '@trezor/components';

import { useIsApproveOverBalance } from './hooks/useIsApproveOverBalance';

export const ApproveOverBalanceWarning = () => {
    const isApproveOverBalance = useIsApproveOverBalance();

    if (!isApproveOverBalance) {
        return null;
    }

    return (
        <Banner
            intent="info"
            data-testid="@yield/warning/approve-over-balance"
            description={
                <Text>
                    <Translation id="TR_APPROVE_OVER_BALANCE" />
                </Text>
            }
        />
    );
};
