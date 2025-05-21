import { forwardRef } from 'react';
import { TextInput } from 'react-native';

import type { UseFormReturn } from '@suite-native/forms';

import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { FocusableFormValues } from '../../types/general';
import { AmountInput, AmountInputProps } from '../general/AmountInput';

type InputKey = 'fiatValue' | 'cryptoValue';

export type BuyAmountInputProps = Omit<AmountInputProps<InputKey>, 'form'>;

export { MAX_INPUT_HEIGHT, MIN_INPUT_WIDTH } from '../general/AmountInput';

export const BuyAmountInput = forwardRef<TextInput, BuyAmountInputProps>((props, ref) => {
    const form = useBuyFormContext() as unknown as UseFormReturn<FocusableFormValues<string>>;

    return <AmountInput ref={ref} form={form} {...props} />;
});
