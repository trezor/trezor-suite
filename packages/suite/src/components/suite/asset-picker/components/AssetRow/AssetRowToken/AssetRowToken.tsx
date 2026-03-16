import { getCoingeckoId, getDisplaySymbol } from '@suite-common/wallet-config';
import { type Account, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Row } from '@trezor/components';
import { AssetLogo, shouldShowNetworkIcon } from '@trezor/product-components';

import { type TokensWithRates } from 'src/utils/wallet/tokenUtils';

import { ItemClickableContainer } from '../ItemClickableContainer';
import { AssetAmount } from './AssetAmount';
import { AssetDetails } from '../AssetDetails';

export type AssetRowTokenProps = {
    token: TokensWithRates;
    account: Account;
    onClick?: (token: TokensWithRates, account: Account) => void;
    dataTestId?: string;
    isHiddenToken?: boolean;
};

export function AssetRowToken({
    token,
    account,
    dataTestId,
    onClick,
    isHiddenToken = false,
}: AssetRowTokenProps) {
    return (
        <ItemClickableContainer
            onClick={() => {
                onClick?.(token, account);
            }}
            padding={isHiddenToken ? { left: 16, vertical: 8, right: 16 } : undefined}
            isDisabled={!onClick}
        >
            <Row data-testid={dataTestId} gap={12} overflow="hidden">
                <AssetLogo
                    size={40}
                    coingeckoId={getCoingeckoId(account.symbol)!}
                    symbol={account.symbol}
                    contractAddress={token.contract}
                    placeholder={getDisplaySymbol(token.symbol!, token.contract)}
                    showNetworkIcon={shouldShowNetworkIcon(account.symbol, token.contract)}
                />
                <AssetDetails
                    name={token.name!}
                    displaySymbol={token.symbol!}
                    networkSymbol={account.symbol}
                />
            </Row>
            {token.balance && (
                <AssetAmount
                    symbol={token.symbol!}
                    fiatAmount={token.fiatRate ? asBaseCurrencyAmount(token.fiatValue) : undefined}
                    contractAddress={token.contract}
                    amount={token.balance}
                    fiatFallackText={isHiddenToken}
                />
            )}
        </ItemClickableContainer>
    );
}
