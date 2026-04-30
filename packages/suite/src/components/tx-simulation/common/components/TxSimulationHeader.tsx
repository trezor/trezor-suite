import { type ReactNode } from 'react';

import { type Account } from '@suite-common/wallet-types';
import { Row } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { AccountLabel } from 'src/components/suite/AccountLabel';

interface TxSimulationHeaderProps {
    account: Account | null;
    children?: ReactNode;
}

export function TxSimulationHeader({ account, children }: TxSimulationHeaderProps) {
    return (
        <Row
            columnGap={spacings.md}
            rowGap={spacings.xxs}
            flexWrap="wrap"
            margin={{ top: spacings.xs }}
        >
            {account && (
                <Row gap={spacings.xxs}>
                    <CoinLogo size={14} symbol={account.symbol} />
                    <AccountLabel
                        account={account}
                        showAccountTypeBadge
                        accountTypeBadgeSize="small"
                    />
                </Row>
            )}
            {children}
        </Row>
    );
}
