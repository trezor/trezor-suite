import { getDisplaySymbol, getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { Column, Row, Text } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

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
            <Row
                data-testid={`${dataTestId}/${account.symbol}`}
                gap={spacings.sm}
                alignItems="center"
            >
                <CoinLogo symbol={account.symbol} size={40} type="tokenWithNetwork" />

                <Column alignItems="flex-start" justifyContent="flex-start">
                    <Text variant="default" typographyStyle="body">
                        {getNetworkDisplaySymbolName(account.symbol)}
                    </Text>
                    <Text variant="tertiary" typographyStyle="hint">
                        {getDisplaySymbol(account.symbol)}
                    </Text>
                </Column>
            </Row>

            <AccountAmount account={account} />
        </ItemClickableContainer>
    );
}
