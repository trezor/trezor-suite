import { type ReactNode } from 'react';

import { type TokenSymbol } from '@suite-common/wallet-types';
import {
    Card,
    Divider,
    HStack,
    Hint,
    PressableOpacity,
    Switch,
    Text,
    VStack,
} from '@suite-native/atoms';
import { TokenAmountFormatter } from '@suite-native/formatters';
import { useField } from '@suite-native/forms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { YieldAmountInput } from './YieldAmountInput';

type YieldAmountInputCardProps = {
    amountLabel: ReactNode;
    isApprovalLimitDisabled?: boolean;
    approvalLimitTitle?: ReactNode;
    balance?: string;
    isMaxSelected: boolean;
    maxLabel: ReactNode;
    onAmountChange: () => void;
    onApprovalLimitPress?: () => void;
    onMaxChange: (value: boolean) => void;
    tokenSymbol: TokenSymbol;
};

export const YieldAmountInputCard = ({
    amountLabel,
    approvalLimitTitle,
    balance,
    isApprovalLimitDisabled = false,
    isMaxSelected,
    maxLabel,
    onAmountChange,
    onApprovalLimitPress,
    onMaxChange,
    tokenSymbol,
}: YieldAmountInputCardProps) => {
    const { errorMessage } = useField({ name: 'amount' });
    const hasBalance = balance !== undefined;
    const shouldShowApprovalLimit = !!approvalLimitTitle && !!onApprovalLimitPress;
    const approvalLimitRow = (
        <HStack
            justifyContent="space-between"
            alignItems="center"
            paddingHorizontal="sp16"
            paddingVertical="sp20"
        >
            <Text variant="body-sm">
                <Translation id="earn.yieldDepositFlowScreen.approvalLimit" />
            </Text>
            <HStack spacing="sp8" alignItems="center">
                <Text variant="body-sm">{approvalLimitTitle}</Text>
                {!isApprovalLimitDisabled && (
                    <Icon name="caretDown" size="medium" color="contentPrimary" />
                )}
            </HStack>
        </HStack>
    );

    return (
        <Card noPadding>
            <VStack spacing="sp12" padding="sp16">
                <HStack justifyContent="space-between" alignItems="center">
                    <Text variant="body-sm">{amountLabel}</Text>
                    <HStack spacing="sp8" alignItems="center">
                        <Text variant="body-sm">{maxLabel}</Text>
                        <Switch isChecked={isMaxSelected} onChange={onMaxChange} />
                    </HStack>
                </HStack>
                <YieldAmountInput
                    isDisabled={isMaxSelected}
                    onAmountChange={onAmountChange}
                    tokenSymbol={tokenSymbol}
                />
                {errorMessage && <Hint variant="error">{errorMessage}</Hint>}
                {hasBalance && (
                    <HStack spacing="sp4" alignItems="center">
                        <Text variant="body-sm" color="contentSecondary">
                            <Translation id="earn.yieldDepositFlowScreen.balance" />
                        </Text>
                        <TokenAmountFormatter
                            value={balance}
                            tokenSymbol={tokenSymbol}
                            variant="body-sm"
                            color="contentSecondary"
                        />
                    </HStack>
                )}
            </VStack>
            {shouldShowApprovalLimit && (
                <>
                    <Divider paddingHorizontal="sp16" />
                    {isApprovalLimitDisabled ? (
                        approvalLimitRow
                    ) : (
                        <PressableOpacity onPress={onApprovalLimitPress}>
                            {approvalLimitRow}
                        </PressableOpacity>
                    )}
                </>
            )}
        </Card>
    );
};
