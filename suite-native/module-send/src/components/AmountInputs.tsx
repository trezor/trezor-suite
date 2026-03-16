import Animated, { LinearTransition } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { useRoute } from '@react-navigation/native';

import {
    type AccountsRootState,
    selectAccountNetworkSymbol,
    useDisplayBaseCurrency,
} from '@suite-common/wallet-core';
import { events } from '@suite-native/analytics';
import { type ActiveView, AnimatedDoubleInput, HStack, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type SendStackParamList,
    type SendStackRoutes,
    type StackProps,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';

import { AmountErrorMessage } from './AmountErrorMessage';
import { CryptoAmountInput } from './CryptoAmountInput';
import { FiatAmountInput } from './FiatAmountInput';
import { SendMaxButton } from './SendMaxButton';

type AmountInputProps = {
    index: number;
};

type RouteProps = StackProps<SendStackParamList, SendStackRoutes.SendOutputs>['route'];

export const AmountInputs = ({ index }: AmountInputProps) => {
    const analytics = useAnalytics();
    const route = useRoute<RouteProps>();
    const { accountKey, tokenContract } = route.params;

    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const { shallDisplayBaseCurrency } = useDisplayBaseCurrency(symbol);

    const onInputSwitch = (activeView: ActiveView) => {
        analytics.report({
            type: events.sendAmountInputSwitchedEvent.name,
            payload: { changedTo: activeView === 'primary' ? 'crypto' : 'fiat' },
        });
    };

    if (!symbol) return null;

    return (
        <VStack spacing="sp12">
            <HStack flex={1} justifyContent="space-between" alignItems="center">
                <Animated.View layout={LinearTransition}>
                    <Text variant="body-sm">
                        <Translation id="moduleSend.outputs.recipients.amountLabel" />
                    </Text>
                </Animated.View>
                <SendMaxButton
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
                    accountKey={accountKey}
                    symbol={symbol}
                    tokenContract={tokenContract}
                />
            )}

            <AmountErrorMessage outputIndex={index} isFiatDisplayed={shallDisplayBaseCurrency} />
        </VStack>
    );
};
