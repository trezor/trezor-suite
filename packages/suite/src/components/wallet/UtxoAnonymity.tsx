import { Icon, Row, Text } from '@trezor/components';
import { UsersIcon } from '@trezor/icons';

type UtxoAnonymityProps = {
    anonymity: number; // float
};

export const UtxoAnonymity = ({ anonymity }: UtxoAnonymityProps) => (
    <Row gap={6}>
        <Icon as={UsersIcon} size={20} />
        <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
            {Math.floor(anonymity)}
        </Text>
    </Row>
);
