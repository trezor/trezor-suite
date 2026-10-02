import { Translation } from '@suite/intl';
import { Banner, Button, Column, Text } from '@trezor/components';

type YieldApprovalInsufficientWarningProps = {
    onModifyApproval?: () => void;
};

export function YieldApprovalInsufficientWarning({
    onModifyApproval,
}: YieldApprovalInsufficientWarningProps) {
    return (
        <Banner
            intent="warning"
            data-testid="@yield/warning/approval-too-low"
            description={
                <Column gap={12}>
                    <Text>
                        <Translation id="TR_EARN_YIELD_APPROVAL_TOO_LOW" />
                    </Text>
                    {onModifyApproval && (
                        <Button
                            size="small"
                            intent="warning"
                            onClick={onModifyApproval}
                            data-testid="@yield/warning/modify-approval-button"
                        >
                            <Translation id="TR_EARN_YIELD_MODIFY_APPROVAL" />
                        </Button>
                    )}
                </Column>
            }
        />
    );
}
