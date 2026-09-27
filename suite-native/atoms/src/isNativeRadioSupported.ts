import { type RadioProps } from './radioTypes';

const nativeRadioProps = new Set([
    'value',
    'onPress',
    'isChecked',
    'isDisabled',
    'disabled',
    'style',
    'testID',
    'accessibilityLabel',
]);

export const isNativeRadioSupported = <TValue>(props: RadioProps<TValue>) =>
    Object.entries(props).every(([key, value]) => value === undefined || nativeRadioProps.has(key));
