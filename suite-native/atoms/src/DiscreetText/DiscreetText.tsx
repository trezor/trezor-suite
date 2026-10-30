import { Discreet } from '../Discreet/Discreet';
import { Text, type TextProps } from '../Text';

export type DiscreetTextProps = TextProps & {
    isForcedDiscreetMode?: boolean;
};

// Formatters redact their output; callers must redact any raw values before passing them here.
export const DiscreetText = ({
    children,
    color = 'contentPrimary',
    isForcedDiscreetMode,
    testID,
    ...textProps
}: DiscreetTextProps) => {
    if (children === null || children === undefined || children === '') return null;

    return (
        <Discreet
            color={color}
            placeholderVariant={textProps.variant}
            isForcedDiscreetMode={isForcedDiscreetMode}
        >
            <Text color={color} testID={testID} {...textProps}>
                {children}
            </Text>
        </Discreet>
    );
};
