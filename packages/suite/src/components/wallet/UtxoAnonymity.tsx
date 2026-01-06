import { Icon, Row, Text } from '@trezor/components';

type UtxoAnonymityProps = {
    anonymity: number; // float
};

export const UtxoAnonymity = ({ anonymity }: UtxoAnonymityProps) => (
    <Row gap={6}>
        <Icon name="users" size={20} />
        <Text typographyStyle="label" variant="tertiary">
            {Math.floor(anonymity)}
        </Text>
    </Row>
);
