import { events } from '@suite-native/analytics';
import { type ActiveView, AnimatedDoubleInput, HStack, Text } from '@suite-native/atoms';
import { BaseAmountInputs } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useAnalytics } from '@suite-native/services';

import { AmountErrorMessage } from './AmountErrorMessage';
import { CryptoAmountInput } from './CryptoAmountInput';
import { FiatAmountInput } from './FiatAmountInput';
import { SendMaxSwitch } from './SendMaxSwitch';

type AmountInputsProps = {
    index: number;
    accountKey: AccountKey;
    symbol: NetworkSymbol;
    tokenContract?: TokenAddress;
    onInputSwitch?: (activeView: ActiveView) => void;
};

export const AmountInputs = ({
    index,
    accountKey,
    symbol,
    tokenContract,
    onInputSwitch,
}: AmountInputsProps) => {
    const analytics = useAnalytics();

    const handleInputSwitch = (activeView: ActiveView) => {
        analytics.report({
            type: events.sendAmountInputSwitchedEvent.name,
            payload: { changedTo: activeView === 'primary' ? 'crypto' : 'fiat' },
        });
        onInputSwitch?.(activeView);
    };

    return (
        <BaseAmountInputs
            symbol={symbol}
            tokenContract={tokenContract}
            onInputSwitch={handleInputSwitch}
            renderTopRow={() => (
                <>
                    <HStack>
                        <Text variant="body-sm">
                            <Translation id="moduleSend.outputs.recipients.amountLabel" />
                        </Text>

                        <SendMaxSwitch
                            outputIndex={index}
                            accountKey={accountKey}
                            tokenContract={tokenContract}
                        />
                    </HStack>
                    {shallDisplayBaseCurrency ? (
                        <AnimatedDoubleInput
                            renderPrimary={({ onPress, isDisabled, inputRef }) => (
                                <CryptoAmountInput
                                    recipientIndex={index}
                                    inputRef={inputRef}
                                    accountKey={accountKey}
                                    symbol={symbol}
                                    tokenContract={tokenContract}
                                    isDisabled={isDisabled}
                                    onPress={onPress}
                                />
                            )}
                            renderSecondary={({ onPress, isDisabled, inputRef }) => (
                                <FiatAmountInput
                                    recipientIndex={index}
                                    inputRef={inputRef}
                                    accountKey={accountKey}
                                    isDisabled={isDisabled}
                                    symbol={symbol}
                                    tokenContract={tokenContract}
                                    onPress={onPress}
                                />
                            )}
                            onInputSwitch={onInputSwitch}
                        />
                    ) : (
                        <CryptoAmountInput
                            recipientIndex={index}
                            inputRef={inputRef}
                            accountKey={accountKey}
                            symbol={symbol}
                            tokenContract={tokenContract}
                            isDisabled={isDisabled}
                            onPress={onPress}
                        />
                    )}
                </>
            )}
            renderFiatInput={({ onPress, isDisabled, inputRef }) => (
                <FiatAmountInput
                    recipientIndex={index}
                    inputRef={inputRef}
                    accountKey={accountKey}
                    isDisabled={isDisabled}
                    symbol={symbol}
                    tokenContract={tokenContract}
                    onPress={onPress}
                />
            )}
            renderErrorMessage={isFiatDisplayed => (
                <AmountErrorMessage outputIndex={index} isFiatDisplayed={isFiatDisplayed} />
            )}
        />
    );
};
