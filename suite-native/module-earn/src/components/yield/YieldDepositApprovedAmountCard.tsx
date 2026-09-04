import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenSymbol } from '@suite-common/wallet-types';
import { Card, HStack, PressableOpacity, Text } from '@suite-native/atoms';
import { Icon, TokenIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { YieldFormattedAmount } from './YieldFormattedAmount';

type YieldDepositApprovedAmountCardProps = {
    actionType?: 'edit' | 'revoke';
    approvedAmount: string | null;
    isApprovedAmountUnlimited: boolean;
    networkSymbol: NetworkSymbol;
    onActionPress?: () => void;
    tokenDecimals?: number;
    tokenContract: string;
    tokenSymbol: TokenSymbol;
};

export const YieldDepositApprovedAmountCard = ({
    actionType,
    approvedAmount,
    isApprovedAmountUnlimited,
    networkSymbol,
    onActionPress,
    tokenDecimals,
    tokenContract,
    tokenSymbol,
}: YieldDepositApprovedAmountCardProps) => (
    <Card>
        <HStack alignItems="center" justifyContent="space-between">
            <Text variant="body-sm">
                <Translation id="earn.yieldDepositFlowScreen.approvedAmount" />
            </Text>
            <HStack alignItems="center" spacing="sp8">
                <TokenIcon symbol={networkSymbol} contractAddress={tokenContract} size={20} />
                {isApprovedAmountUnlimited ? (
                    <Text variant="body-sm-strong" numberOfLines={1}>
                        <Translation id="earn.yieldDepositFlowScreen.approvalLimitSheet.unlimited.title" />
                    </Text>
                ) : null}
                {!isApprovedAmountUnlimited && approvedAmount ? (
                    <YieldFormattedAmount
                        value={approvedAmount}
                        networkSymbol={networkSymbol}
                        tokenContract={tokenContract}
                        tokenDecimals={tokenDecimals}
                        tokenSymbol={tokenSymbol}
                        variant="body-sm-strong"
                        color="contentPrimary"
                        numberOfLines={1}
                    />
                ) : null}
                {actionType !== undefined && onActionPress !== undefined && (
                    <PressableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={
                            actionType === 'edit'
                                ? 'Edit approval amount'
                                : 'Revoke approval amount'
                        }
                        onPress={onActionPress}
                    >
                        <Icon
                            name={actionType === 'edit' ? 'pencilSimple' : 'x'}
                            size="mediumLarge"
                            color="contentPrimary"
                        />
                    </PressableOpacity>
                )}
            </HStack>
        </HStack>
    </Card>
);
