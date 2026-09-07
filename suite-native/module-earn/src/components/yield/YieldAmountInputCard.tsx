import { type ReactNode, useState } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';
import {
    type ActiveView,
    BaseAmountInputs,
    Card,
    Divider,
    HStack,
    PressableOpacity,
    Text,
    VStack,
} from '@suite-native/atoms';
import { CompactTokenAmountFormatter, asDecimalTokenAmount } from '@suite-native/formatters';
import { useFormContext } from '@suite-native/forms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { AMOUNT_INPUT_UNFOCUSED_OFFSET, AMOUNT_INPUT_WRAPPER_HEIGHT } from '../../constants';
import { type YieldDepositFormValues } from '../../utils/yield/yieldDepositFormSchema';
import { EarnAmountErrorMessage } from '../earn/EarnAmountErrorMessage';
import { EarnCryptoAmountInput } from '../earn/EarnCryptoAmountInput';
import { EarnFiatAmountInput } from '../earn/EarnFiatAmountInput';
import { EarnMaxSwitch } from '../earn/EarnMaxSwitch';

type YieldAmountInputCardProps = {
    amountLabel: ReactNode;
    approvalLimitTitle?: ReactNode;
    balance?: string;
    isApprovalLimitDisabled?: boolean;
    onApprovalLimitPress?: () => void;
    onCurrencyChange?: (activeView: ActiveView) => void;
    onMaxPress: () => void;
    symbol: NetworkSymbol;
    tokenContract?: TokenAddress;
    tokenDecimals?: number;
    tokenSymbol: TokenSymbol;
};

export const YieldAmountInputCard = ({
    amountLabel,
    approvalLimitTitle,
    balance,
    isApprovalLimitDisabled = false,
    onApprovalLimitPress,
    onCurrencyChange,
    onMaxPress,
    symbol,
    tokenContract,
    tokenDecimals,
    tokenSymbol,
}: YieldAmountInputCardProps) => {
    const { setValue } = useFormContext<YieldDepositFormValues>();
    const [isMaxSelected, setIsMaxSelected] = useState(false);

    const hasBalance = balance !== undefined;
    const shouldShowApprovalLimit = !!approvalLimitTitle && !!onApprovalLimitPress;

    const handleMaxChange = (value: boolean) => {
        setIsMaxSelected(value);

        if (!value) {
            setValue('amount', '', { shouldValidate: false });
            setValue('fiat', '', { shouldValidate: false });

            return;
        }

        onMaxPress();
    };

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
                <BaseAmountInputs
                    symbol={symbol}
                    onInputSwitch={onCurrencyChange}
                    unfocusedOffset={AMOUNT_INPUT_UNFOCUSED_OFFSET}
                    wrapperHeight={AMOUNT_INPUT_WRAPPER_HEIGHT}
                    renderTopRow={() => (
                        <>
                            <Text variant="body-sm">{amountLabel}</Text>
                            <EarnMaxSwitch
                                isChecked={isMaxSelected}
                                onChange={handleMaxChange}
                                testID="@yield-deposit/max-switch"
                            />
                        </>
                    )}
                    renderCryptoInput={({ onPress, isDisabled, inputRef }) => (
                        <EarnCryptoAmountInput
                            symbol={symbol}
                            tokenContract={tokenContract}
                            tokenDecimals={tokenDecimals}
                            displaySymbol={tokenSymbol}
                            accessibilityLabel="amount to deposit input"
                            inputRef={inputRef}
                            isDisabled={isMaxSelected || isDisabled}
                            onPress={onPress}
                        />
                    )}
                    renderFiatInput={({ onPress, isDisabled, inputRef }) => (
                        <EarnFiatAmountInput
                            symbol={symbol}
                            tokenContract={tokenContract}
                            tokenDecimals={tokenDecimals}
                            accessibilityLabel="fiat amount to deposit input"
                            inputRef={inputRef}
                            isDisabled={isMaxSelected || isDisabled}
                            onPress={onPress}
                        />
                    )}
                    renderErrorMessage={isFiatDisplayed => (
                        <EarnAmountErrorMessage isFiatDisplayed={isFiatDisplayed} />
                    )}
                />
                {hasBalance && (
                    <HStack spacing="sp4" alignItems="center">
                        <Text variant="body-sm" color="contentSecondary">
                            <Translation id="earn.yieldDepositFlowScreen.balance" />
                        </Text>
                        <CompactTokenAmountFormatter
                            value={asDecimalTokenAmount(balance)}
                            tokenSymbol={tokenSymbol}
                            tokenDecimals={tokenDecimals}
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
