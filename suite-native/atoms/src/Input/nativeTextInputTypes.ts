export type NativeTextInputProps = {
    value: string;
    label: string;
    placeholder?: string;
    /** Accepts native edits without filtering or formatting the text. */
    onChangeText?: (text: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    keyboardType?: 'default' | 'url' | 'email-address' | 'number-pad' | 'decimal-pad';
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    autoCorrect?: boolean;
    autoFocus?: boolean;
    maxLength?: number;
    editable?: boolean;
    hasError?: boolean;
    testID?: string;
};
