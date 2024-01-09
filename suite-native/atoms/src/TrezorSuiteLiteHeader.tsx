import { TypographyStyle } from '@trezor/theme';
import { Translation } from '@suite-native/intl';

import { Text } from './Text';

type TrezorSuiteLiteHeaderProps = {
    textVariant?: TypographyStyle;
};

export const TrezorSuiteLiteHeader = ({
    textVariant = 'titleSmall',
}: TrezorSuiteLiteHeaderProps) => (
    <Text variant={textVariant} color="textSecondaryHighlight" textAlign="center">
        <Translation
            id="generic.header"
            values={{
                green: chunks => (
                    <Text variant={textVariant} color="textSecondaryHighlight">
                        {chunks}
                    </Text>
                ),
                grey: chunks => (
                    <Text variant={textVariant} color="textSubdued">
                        {chunks}
                    </Text>
                ),
            }}
        />
    </Text>
);
