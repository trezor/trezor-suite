import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Card, HStack, PressableOpacity, Text } from '@suite-native/atoms';
import { CryptoIcon, Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

type YieldDepositApprovedAmountCardProps = {
    approvedAmount: string | null;
    isApprovedAmountUnlimited: boolean;
    networkSymbol: NetworkSymbol;
    onEditApprovalPress: () => void;
    tokenContract: string;
};

export const YieldDepositApprovedAmountCard = ({
    approvedAmount,
    isApprovedAmountUnlimited,
    networkSymbol,
    onEditApprovalPress,
    tokenContract,
}: YieldDepositApprovedAmountCardProps) => (
    <Card>
        <HStack alignItems="center" justifyContent="space-between">
            <Text variant="body-sm">
                <Translation id="earn.yieldDepositFlowScreen.approvedAmount" />
            </Text>
            <HStack alignItems="center" spacing="sp8">
                <CryptoIcon symbol={networkSymbol} contractAddress={tokenContract} size={20} />
                <Text variant="body-sm-strong" numberOfLines={1}>
                    {isApprovedAmountUnlimited ? (
                        <Translation id="earn.yieldDepositFlowScreen.approvalLimitSheet.unlimited.title" />
                    ) : (
                        approvedAmount
                    )}
                </Text>
                {!isApprovedAmountUnlimited && (
                    <PressableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Edit approval amount"
                        onPress={onEditApprovalPress}
                    >
                        <Icon name="pencilSimple" size="mediumLarge" color="contentPrimary" />
                    </PressableOpacity>
                )}
            </HStack>
        </HStack>
    </Card>
);
