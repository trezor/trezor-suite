import { type ReactNode } from 'react';

import { AccountLabel } from '@suite/account';
import { type Account } from '@suite-common/wallet-types';
import { Row } from '@trezor/components';
import { TokenIcon } from '@trezor/product-components';

interface TxSimulationHeaderProps {
    account: Account | null;
    children?: ReactNode;
}

export function TxSimulationHeader({ account, children }: TxSimulationHeaderProps) {
    return (
        <Row columnGap={16} rowGap={4} flexWrap="wrap" margin={{ top: 8 }}>
            {account && (
                <Row gap={4}>
                    <TokenIcon size={16} symbol={account.symbol} />
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
