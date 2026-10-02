import { Translation } from '@suite/intl';
import { Banner, Text } from '@trezor/components';

export function YieldApproveOverBalanceWarning() {
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
}
