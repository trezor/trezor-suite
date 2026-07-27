import { Translation, type TranslationKey } from '@suite/intl';
import { Icon, Row, Spinner, Text } from '@trezor/components';
import { CheckIcon } from '@trezor/icons';

type PairingStateProps = {
    isLoading?: boolean;
    text: TranslationKey;
};

export const PairingState = ({ isLoading, text }: PairingStateProps) => (
    <Row gap={10}>
        {isLoading ? (
            <Spinner size={20} isDisabled={true} />
        ) : (
            <Icon size={18} as={CheckIcon} intent="brand" />
        )}
        <Text
            intent={isLoading ? 'neutral' : 'brand'}
            priority={isLoading ? 'secondary' : 'primary'}
        >
            <Translation id={text} />
        </Text>
    </Row>
);
