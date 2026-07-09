import { type ReactNode } from 'react';

import { AccountLabel } from '@suite/account';
import { type Account } from '@suite-common/wallet-types';
import { Row } from '@trezor/components';
import { TokenLogo } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

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
                    <TokenLogo symbol={account.symbol} size={16} />
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
