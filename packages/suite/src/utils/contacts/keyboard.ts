/**
 * Whether an Enter keypress in a text field should submit. While an IME composition is in progress
 * (Chinese, Japanese, Korean and other composed input), Enter confirms the candidate and must not
 * submit the half-composed text.
 */
export const isEnterSubmit = (event: {
    key: string;
    nativeEvent: { isComposing: boolean };
}): boolean => event.key === 'Enter' && !event.nativeEvent.isComposing;
