import { Translation } from '@suite/intl';
import { Banner, Button, Column, Text } from '@trezor/components';

import { useIsApprovalTooLowWarningVisible } from './hooks/useIsApprovalTooLowWarningVisible';
import { useActionStepWarningsContext } from '../ActionStepWarningsContext/hooks/useActionStepWarningsContext';

export const ApprovalTooLowWarning = () => {
    const { onModifyApproval } = useActionStepWarningsContext();
    const isVisible = useIsApprovalTooLowWarningVisible();

    if (!isVisible) {
        return null;
    }

    return (
        <Banner
            intent="warning"
            data-testid="@yield/warning/approval-too-low"
            description={
                <Column gap={12}>
                    <Text>
                        <Translation id="TR_EARN_YIELD_APPROVAL_TOO_LOW" />
                    </Text>
                    <Button
                        size="small"
                        intent="warning"
                        onClick={onModifyApproval}
                        data-testid="@yield/warning/modify-approval-button"
                    >
                        <Translation id="TR_EARN_YIELD_MODIFY_APPROVAL" />
                    </Button>
                </Column>
            }
        />
    );
};
