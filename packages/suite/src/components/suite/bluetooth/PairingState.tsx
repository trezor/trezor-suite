import { Translation, type TranslationKey } from '@suite/intl';
import { Icon, Row, Spinner, Text } from '@trezor/components';

type PairingStateProps = {
    isLoading?: boolean;
    text: TranslationKey;
};

export const PairingState = ({ isLoading, text }: PairingStateProps) => (
    <Row gap={10}>
        {isLoading ? (
            <Spinner size={20} isDisabled={true} />
        ) : (
            <Icon size={18} name="check" intent="brand" />
        )}
        <Text
            intent={isLoading ? 'neutral' : 'brand'}
            priority={isLoading ? 'secondary' : 'primary'}
        >
            <Translation id={text} />
        </Text>
    </Row>
);
