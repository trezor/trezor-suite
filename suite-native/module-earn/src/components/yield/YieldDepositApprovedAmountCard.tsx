import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Card, HStack, PressableOpacity, Text } from '@suite-native/atoms';
import { Icon, TokenIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

type YieldDepositApprovedAmountCardProps = {
    actionType?: 'edit' | 'revoke';
    approvedAmount: string | null;
    isApprovedAmountUnlimited: boolean;
    networkSymbol: NetworkSymbol;
    onActionPress?: () => void;
    tokenContract: string;
};

export const YieldDepositApprovedAmountCard = ({
    actionType,
    approvedAmount,
    isApprovedAmountUnlimited,
    networkSymbol,
    onActionPress,
    tokenContract,
}: YieldDepositApprovedAmountCardProps) => (
    <Card>
        <HStack alignItems="center" justifyContent="space-between">
            <Text variant="body-sm">
                <Translation id="earn.yieldDepositFlowScreen.approvedAmount" />
            </Text>
            <HStack alignItems="center" spacing="sp8">
                <TokenIcon symbol={networkSymbol} contractAddress={tokenContract} size={20} />
                <Text variant="body-sm-strong" numberOfLines={1}>
                    {isApprovedAmountUnlimited ? (
                        <Translation id="earn.yieldDepositFlowScreen.approvalLimitSheet.unlimited.title" />
                    ) : (
                        approvedAmount
                    )}
                </Text>
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
