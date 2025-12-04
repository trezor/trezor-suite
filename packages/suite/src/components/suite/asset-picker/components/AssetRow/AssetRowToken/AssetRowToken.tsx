import { getCoingeckoId, getDisplaySymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { asBaseCurrencyAmount } from '@suite-common/wallet-utils';
import { Row } from '@trezor/components';
import { AssetLogo, shouldShowNetworkIcon } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { TokensWithRates } from 'src/utils/wallet/tokenUtils';

import { ItemClickableContainer } from '../ItemClickableContainer';
import { AssetAmount } from './AssetAmount';
import { AssetDetails } from '../AssetDetails';

export const ASSET_ROW_TOKEN_HEIGHT = 68;

export type AssetRowTokenProps = {
    token: TokensWithRates;
    account: Account;
    onClick: (token: TokensWithRates, account: Account) => void;
    dataTestId?: string;
};

export function AssetRowToken({ token, account, dataTestId, onClick }: AssetRowTokenProps) {
    return (
        <ItemClickableContainer
            onClick={() => {
                onClick(token, account);
            }}
        >
            <Row data-testid={`${dataTestId}/${account.symbol}/${token.symbol}`} gap={spacings.sm}>
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
                    symbol={token.symbol!}
                    networkSymbol={account.symbol}
                />
            </Row>
            {token.balance && (
                <AssetAmount
                    symbol={token.symbol!}
                    fiatAmount={token.fiatRate ? asBaseCurrencyAmount(token.fiatValue) : undefined}
                    contractAddress={token.contract}
                    amount={token.balance}
                />
            )}
        </ItemClickableContainer>
    );
}
