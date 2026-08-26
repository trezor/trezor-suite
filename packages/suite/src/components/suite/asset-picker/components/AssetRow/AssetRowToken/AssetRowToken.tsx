import { getDisplaySymbol } from '@suite-common/wallet-config';
import { type Account, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Row } from '@trezor/components';
import { TokenIcon, shouldShowNetworkIcon } from '@trezor/product-components';

import { type TokensWithRates } from 'src/utils/wallet/tokenUtils';

import { AssetDetails } from '../AssetDetails';
import { ItemClickableContainer } from '../ItemClickableContainer';
import { AssetAmount } from './AssetAmount';

export type AssetRowTokenProps = {
    token: TokensWithRates;
    account: Account;
    onClick?: (token: TokensWithRates, account: Account) => void;
    dataTestId?: string;
    isInsideGroup?: boolean;
    showNoTradingPairText?: boolean;
    isFiatPrimary?: boolean;
};

export function AssetRowToken({
    token,
    account,
    dataTestId,
    onClick,
    isInsideGroup = false,
    showNoTradingPairText = false,
    isFiatPrimary = false,
}: AssetRowTokenProps) {
    const isDisabled = !onClick;

    return (
        <ItemClickableContainer
            onClick={() => {
                onClick?.(token, account);
            }}
            padding={isInsideGroup ? { left: 16, vertical: 8, right: 16 } : undefined}
            isDisabled={isDisabled}
        >
            <Row data-testid={dataTestId} gap={12} overflow="hidden" flex="1" minWidth={0}>
                <TokenIcon
                    size={40}
                    symbol={account.symbol}
                    contractAddress={token.contract}
                    placeholder={getDisplaySymbol(token.symbol!, token.contract)}
                    showNetworkIcon={shouldShowNetworkIcon(account.symbol, token.contract)}
                />
                <AssetDetails
                    name={token.name!}
                    displaySymbol={token.symbol!}
                    networkSymbol={account.symbol}
                    isDisabled={isDisabled}
                />
            </Row>
            {token.balance && (
                <Row flex="0 0 auto">
                    <AssetAmount
                        symbol={token.symbol!}
                        fiatAmount={
                            token.fiatRate ? asBaseCurrencyAmount(token.fiatValue) : undefined
                        }
                        contractAddress={token.contract}
                        amount={token.balance}
                        showNoTradingPairText={showNoTradingPairText}
                        isFiatPrimary={isFiatPrimary}
                        isDisabled={isDisabled}
                    />
                </Row>
            )}
        </ItemClickableContainer>
    );
}
