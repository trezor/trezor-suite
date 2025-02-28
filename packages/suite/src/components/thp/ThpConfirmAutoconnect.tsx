import { Column, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

export const ThpConfirmAutoconnect = () => (
    <Column gap={spacings.xxxxl} flex="1" justifyContent="center" alignItems="center">
        <Text variant="tertiary" typographyStyle="highlight" align="center">
            Do you want to pair with Trezor Suite without confirmation?
        </Text>
    </Column>
);
