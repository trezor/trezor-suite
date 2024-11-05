import { TypographyStyle } from '@trezor/theme';

import { Text, TextProps } from '../Text/Text';

const createHeading =
    (as: 'h1' | 'h2' | 'h3' | 'h4', defaultTypographyStyle: TypographyStyle) =>
    ({ children, ...rest }: TextProps) => (
        <Text as={as} typographyStyle={defaultTypographyStyle} {...rest}>
            {children}
        </Text>
    );

export const H1 = createHeading('h1', 'titleLarge');
export const H2 = createHeading('h2', 'titleMedium');
export const H3 = createHeading('h3', 'titleSmall');
export const H4 = createHeading('h4', 'highlight');
