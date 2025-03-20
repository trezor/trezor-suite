import { Translation } from '@suite-native/intl';
import { NativeTypographyStyle } from '@trezor/theme';

import { Text } from './Text';

type TrezorSuiteLiteHeaderProps = {
    textVariant?: NativeTypographyStyle;
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
