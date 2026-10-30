import { redactNumericalSubstring, useShouldRedactNumbers } from '@suite-common/discreet-mode';

import { Discreet } from '../Discreet/Discreet';
import { Text, type TextProps } from '../Text';

export type DiscreetTextProps = Omit<TextProps, 'children'> & {
    children?: string | number | null;
    isForcedDiscreetMode?: boolean;
};

const DiscreetTextContent = ({ children, ...textProps }: TextProps) => {
    const shouldRedactNumbers = useShouldRedactNumbers();
    const content =
        shouldRedactNumbers && (typeof children === 'string' || typeof children === 'number')
            ? redactNumericalSubstring(children)
            : children;

    return <Text {...textProps}>{content}</Text>;
};

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
            <DiscreetTextContent color={color} testID={testID} {...textProps}>
                {children}
            </DiscreetTextContent>
        </Discreet>
    );
};
