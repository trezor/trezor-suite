import { Translation } from '@suite-native/intl';
import { type NativeTypographyStyle } from '@trezor/theme';

import { Text } from './Text';

type TrezorSuiteHeaderProps = {
    textVariant?: NativeTypographyStyle;
};

export const TrezorSuiteHeader = ({ textVariant = 'headline-sm' }: TrezorSuiteHeaderProps) => (
    <Text variant={textVariant} color="textSecondaryHighlight" textAlign="center">
        <Translation id="generic.trezorSuite" />
    </Text>
);
