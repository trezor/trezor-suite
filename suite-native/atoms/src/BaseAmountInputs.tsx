import { type ReactNode, useRef } from 'react';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { useDisplayBaseCurrency } from '@suite-common/wallet-core';

import {
    AnimatedDoubleInput,
    type RenderInputProps,
} from './AnimatedDoubleView/AnimatedDoubleInput';
import { type ActiveView } from './AnimatedDoubleView/AnimatedDoubleView';
import { type InputType } from './Input/Input';
import { HStack, VStack } from './Stack';

export type BaseAmountInputsProps = {
    symbol: NetworkSymbol;
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
                renderCryptoInput({ inputRef: singleInputRef })
            )}
            {renderErrorMessage?.(shallDisplayBaseCurrency)}
        </VStack>
    );
};
