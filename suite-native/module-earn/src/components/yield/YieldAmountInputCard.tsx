import { type ReactNode } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';
import {
    type ActiveView,
    BaseAmountInputs,
    Button,
    Card,
    Divider,
    HStack,
    PressableOpacity,
    Text,
    VStack,
} from '@suite-native/atoms';
import { CompactTokenAmountFormatter, asDecimalTokenAmount } from '@suite-native/formatters';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { AMOUNT_INPUT_UNFOCUSED_OFFSET, AMOUNT_INPUT_WRAPPER_HEIGHT } from '../../constants';
import { EarnAmountErrorMessage } from '../earn/EarnAmountErrorMessage';
import { EarnCryptoAmountInput } from '../earn/EarnCryptoAmountInput';
import { EarnFiatAmountInput } from '../earn/EarnFiatAmountInput';

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
                <BaseAmountInputs
                    symbol={symbol}
                    onInputSwitch={onCurrencyChange}
                    unfocusedOffset={AMOUNT_INPUT_UNFOCUSED_OFFSET}
                    wrapperHeight={AMOUNT_INPUT_WRAPPER_HEIGHT}
                    renderTopRow={() => <Text variant="body-sm">{amountLabel}</Text>}
                    renderCryptoInput={({ onPress, isDisabled, inputRef }) => (
                        <EarnCryptoAmountInput
                            symbol={symbol}
                            tokenContract={tokenContract}
                            tokenDecimals={tokenDecimals}
                            displaySymbol={tokenSymbol}
                            accessibilityLabel="amount to deposit input"
                            inputRef={inputRef}
                            isDisabled={isDisabled}
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
                            isDisabled={isDisabled}
                            onPress={onPress}
                        />
                    )}
                    renderErrorMessage={isFiatDisplayed => (
                        <EarnAmountErrorMessage isFiatDisplayed={isFiatDisplayed} />
                    )}
                />
                {hasBalance && (
                    <HStack spacing="sp8" alignItems="center">
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
                        <Button
                            size="medium"
                            intent="neutral"
                            priority="secondary"
                            onPress={onMaxPress}
                            testID="@yield-deposit/max-button"
                        >
                            <Translation id="earn.yieldDepositFlowScreen.maxButton" />
                        </Button>
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
