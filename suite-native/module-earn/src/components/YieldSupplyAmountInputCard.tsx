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

import { YieldSupplyAmountInput } from './YieldSupplyAmountInput';

type YieldSupplyAmountInputCardProps = {
    approvalLimitTitle: ReactNode;
    balance?: string;
    isDisabled?: boolean;
    isMaxSelected: boolean;
    onAmountChange: () => void;
    onApprovalLimitPress: () => void;
    onMaxChange: (value: boolean) => void;
    tokenSymbol: TokenSymbol;
};

export const YieldSupplyAmountInputCard = ({
    approvalLimitTitle,
    balance,
    isDisabled = false,
    isMaxSelected,
    onAmountChange,
    onApprovalLimitPress,
    onMaxChange,
    tokenSymbol,
}: YieldSupplyAmountInputCardProps) => {
    const { errorMessage } = useField({ name: 'amount' });
    const hasBalance = balance !== undefined;

    return (
        <Card noPadding>
            <VStack spacing="sp12" padding="sp16">
                <HStack justifyContent="space-between" alignItems="center">
                    <Text variant="body-sm">
                        <Translation id="earn.yieldSupplyFlowScreen.amountToSupply" />
                    </Text>
                    <HStack spacing="sp8" alignItems="center">
                        <Text variant="body-sm">
                            <Translation id="earn.yieldSupplyFlowScreen.supplyMax" />
                        </Text>
                        <Switch
                            isChecked={isMaxSelected}
                            isDisabled={isDisabled}
                            onChange={onMaxChange}
                        />
                    </HStack>
                </HStack>
                <YieldSupplyAmountInput
                    isDisabled={isMaxSelected || isDisabled}
                    onAmountChange={onAmountChange}
                    tokenSymbol={tokenSymbol}
                />
                {errorMessage && <Hint variant="error">{errorMessage}</Hint>}
                {hasBalance && (
                    <HStack spacing="sp4" alignItems="center">
                        <Text variant="body-sm" color="contentSecondary">
                            <Translation id="earn.yieldSupplyFlowScreen.balance" />
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
            <Divider paddingHorizontal="sp16" />
            <PressableOpacity disabled={isDisabled} onPress={onApprovalLimitPress}>
                <HStack
                    justifyContent="space-between"
                    alignItems="center"
                    paddingHorizontal="sp16"
                    paddingVertical="sp20"
                >
                    <Text variant="body-sm">
                        <Translation id="earn.yieldSupplyFlowScreen.approvalLimit" />
                    </Text>
                    <HStack spacing="sp8" alignItems="center">
                        <Text variant="body-sm">{approvalLimitTitle}</Text>
                        <Icon name="caretDown" size="medium" color="contentPrimary" />
                    </HStack>
                </HStack>
            </PressableOpacity>
        </Card>
    );
};
