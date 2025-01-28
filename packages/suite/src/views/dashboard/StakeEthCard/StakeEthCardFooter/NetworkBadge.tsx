import { ReactNode } from 'react';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { Paragraph, Row } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

type NetworkBadgeProps = {
    symbol: NetworkSymbol;
    name: ReactNode;
};

export const NetworkBadge = ({ symbol, name }: NetworkBadgeProps) => (
    <Row gap={spacings.xxs}>
        <CoinLogo symbol={symbol} size={16} />
        <Paragraph>{name}</Paragraph>
    </Row>
);
