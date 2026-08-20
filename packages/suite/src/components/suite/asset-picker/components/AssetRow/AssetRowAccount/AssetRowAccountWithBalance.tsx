import { getDisplaySymbol, getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { Row } from '@trezor/components';
import { TokenIcon } from '@trezor/product-components';

import { AssetDetails } from '../AssetDetails';
import { ItemClickableContainer } from '../ItemClickableContainer';
import { AccountAmount } from './AccountAmount';

export type AssetRowAccountWithBalanceProps = {
    account: Account;
    dataTestId?: string;
    onClick: (account: Account) => void;
};

export function AssetRowAccountWithBalance({
    dataTestId,
    account,
    onClick,
}: AssetRowAccountWithBalanceProps) {
    return (
        <ItemClickableContainer onClick={() => onClick(account)}>
            <Row data-testid={dataTestId} gap={12} alignItems="center" overflow="hidden">
                <TokenIcon
                    symbol={account.symbol}
                    size={40}
                    showNetworkIcon
                    showNativeNetworkBadge
                />
                <AssetDetails
                    name={getNetworkDisplaySymbolName(account.symbol)}
                    displaySymbol={getDisplaySymbol(account.symbol)}
                    networkSymbol={account.symbol}
                />
            </Row>
            <AccountAmount account={account} />
        </ItemClickableContainer>
    );
}
