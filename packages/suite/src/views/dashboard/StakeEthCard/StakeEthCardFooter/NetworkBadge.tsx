import { ReactNode } from 'react';
import { CoinLogo, CoinType, Paragraph, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

type NetworkBadgeProps = {
    logo: CoinType;
    name: ReactNode;
};

export const NetworkBadge = ({ logo, name }: NetworkBadgeProps) => (
    <Row gap={spacings.xxs}>
        <CoinLogo symbol={logo} size={16} />
        <Paragraph>{name}</Paragraph>
    </Row>
);
