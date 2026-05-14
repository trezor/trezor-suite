import { getDisplaySymbol, getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { Column, Row, Text } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';

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
                <CoinLogo symbol={account.symbol} size={40} type="tokenWithNetwork" />
                <Column overflow="hidden" alignItems="flex-start" justifyContent="flex-start">
                    <Text typographyStyle="body-md" ellipsisLineCount={1} maxWidth="100%">
                        {getNetworkDisplaySymbolName(account.symbol)}
                    </Text>
                    <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                        {getDisplaySymbol(account.symbol)}
                    </Text>
                </Column>
            </Row>
            <AccountAmount account={account} />
        </ItemClickableContainer>
    );
}
