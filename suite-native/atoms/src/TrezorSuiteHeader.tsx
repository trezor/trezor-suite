import { Translation } from '@suite-native/intl';
import { NativeTypographyStyle } from '@trezor/theme';

import { Text } from './Text';

type TrezorSuiteHeaderProps = {
    textVariant?: NativeTypographyStyle;
};

export const TrezorSuiteHeader = ({ textVariant = 'titleSmall' }: TrezorSuiteHeaderProps) => (
    <Text variant={textVariant} color="textSecondaryHighlight" textAlign="center">
        <Translation id="generic.trezorSuite" />
    </Text>
);
