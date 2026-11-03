import { Translation } from '@suite/intl';
import { Icon, Row, Text, Tooltip } from '@trezor/components';
import { LockIcon } from '@trezor/icons';

type ApprovalRequiredBadgeProps = {
    symbol: string;
};

export const ApprovalRequiredBadge = ({ symbol }: ApprovalRequiredBadgeProps) => (
    <Tooltip content={<Translation id="TR_APPROVAL_REQUIRED_TOOLTIP" values={{ symbol }} />}>
        <Row gap={4} data-testid="@approval-step/required-badge">
            <Icon as={LockIcon} size={16} intent="neutral" priority="secondary" />
            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                <Translation id="TR_APPROVAL_REQUIRED" />
            </Text>
        </Row>
    </Tooltip>
);
