import { type CryptoId } from 'invity-api';

import { AssetSymbol } from '@suite/assets';
import { Translation } from '@suite/intl';
import { cryptoIdToNetworkSymbolAndContractAddress } from '@suite-common/trading';
import { Icon, Row, Text, Tooltip } from '@trezor/components';
import { LockIcon } from '@trezor/icons';

type ApprovalRequiredBadgeProps = {
    cryptoId: CryptoId;
};

export const ApprovalRequiredBadge = ({ cryptoId }: ApprovalRequiredBadgeProps) => {
    const { networkSymbol, contractAddress } = cryptoIdToNetworkSymbolAndContractAddress(cryptoId);
    const symbol = networkSymbol && (
        <AssetSymbol networkSymbol={networkSymbol} contractAddress={contractAddress} isTruncated />
    );

    return (
        <Tooltip
            content={<Translation id="TR_APPROVAL_REQUIRED_TOOLTIP" values={{ symbol }} />}
            isUnderlined
        >
            <Row gap={4} data-testid="@approval-step/required-badge">
                <Icon as={LockIcon} size={16} intent="neutral" priority="secondary" />
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    <Translation id="TR_APPROVAL_REQUIRED" />
                </Text>
            </Row>
        </Tooltip>
    );
};
