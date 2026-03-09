import { ReactNode, useRef } from 'react';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { useDisplayBaseCurrency } from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';

import { AnimatedDoubleInput, RenderInputProps } from './AnimatedDoubleView/AnimatedDoubleInput';
import { ActiveView } from './AnimatedDoubleView/AnimatedDoubleView';
import { InputType } from './Input/Input';
import { HStack, VStack } from './Stack';

export type BaseAmountInputsProps = {
    index: number;
    accountKey: AccountKey;
    symbol: NetworkSymbol;
    tokenContract?: TokenAddress;
    onInputSwitch?: (activeView: ActiveView) => void;
    renderTopRow: () => ReactNode;
    renderCryptoInput: (props: RenderInputProps) => ReactNode;
    renderFiatInput: (props: RenderInputProps) => ReactNode;
    renderErrorMessage?: (isFiatDisplayed: boolean) => ReactNode;
};

export const BaseAmountInputs = ({
    symbol,
    onInputSwitch,
    renderTopRow,
    renderCryptoInput,
    renderFiatInput,
    renderErrorMessage,
}: BaseAmountInputsProps) => {
    const { shallDisplayBaseCurrency } = useDisplayBaseCurrency(symbol);
    const singleInputRef = useRef<InputType | null>(null);

    return (
        <VStack spacing="sp12">
            <Animated.View layout={LinearTransition}>
                <HStack flex={1} justifyContent="space-between" alignItems="center">
                    {renderTopRow()}
                </HStack>
            </Animated.View>
            {shallDisplayBaseCurrency ? (
                <AnimatedDoubleInput
                    renderPrimary={props => renderCryptoInput(props)}
                    renderSecondary={props => renderFiatInput(props)}
                    onInputSwitch={onInputSwitch}
                />
            ) : (
                renderCryptoInput({
                    isDisabled: false,
                    onPress: undefined,
                    inputRef: singleInputRef,
                })
            )}
            {renderErrorMessage?.(shallDisplayBaseCurrency)}
        </VStack>
    );
};
