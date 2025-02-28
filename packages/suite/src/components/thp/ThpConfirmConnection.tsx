import { Column, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

export const ThpConfirmConnection = () => (
    <Column gap={spacings.xxxxl} flex="1" justifyContent="center" alignItems="center">
        <Text variant="tertiary" typographyStyle="highlight" align="center">
            Confirm connection on device
        </Text>
    </Column>
);
