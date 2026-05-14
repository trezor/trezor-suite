import { type TypographyStyle } from '@trezor/theme';

import { Text, type TextProps } from '../Text/Text';

const createHeading =
    (as: 'h1' | 'h2' | 'h3' | 'h4', defaultTypographyStyle: TypographyStyle) =>
    ({ children, ...rest }: TextProps) => (
        <Text as={as} typographyStyle={defaultTypographyStyle} {...rest}>
            {children}
        </Text>
    );

export const H1 = createHeading('h1', 'headline-lg');
export const H2 = createHeading('h2', 'headline-md');
export const H3 = createHeading('h3', 'headline-sm');
export const H4 = createHeading('h4', 'body-md-strong');
