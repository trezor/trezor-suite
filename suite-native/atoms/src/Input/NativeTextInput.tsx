import { Input } from './Input';
import { InputWrapper } from './InputWrapper';
import { type NativeTextInputProps } from './nativeTextInputTypes';

export const NativeTextInput = (props: NativeTextInputProps) => (
    <InputWrapper label={props.label}>
        <Input {...props} labelType="outsideLabel" accessibilityLabel={props.label} />
    </InputWrapper>
);

export type { NativeTextInputProps } from './nativeTextInputTypes';
