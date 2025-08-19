import { Icon, Row, Spinner, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation, TranslationKey } from '../Translation';

type PairingStateProps = {
    isLoading?: boolean;
    text: TranslationKey;
};

export const PairingState = ({ isLoading, text }: PairingStateProps) => (
    <Row gap={isLoading ? spacings.xxs : spacings.md} alignItems="center">
        {isLoading ? <Spinner size={spacings.md} /> : <Icon size="small" name="check" />}
        <Text variant={isLoading ? 'tertiary' : 'primary'}>
            <Translation id={text} />
        </Text>
    </Row>
);
