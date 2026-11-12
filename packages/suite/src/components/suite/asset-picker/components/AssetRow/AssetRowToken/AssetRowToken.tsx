import { AssetIcon } from '@suite/assets';
import { toTokenAddress } from '@suite-common/tokens';
import { type Account, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Row } from '@trezor/components';
import { selectShouldShowNetworkIcon } from '@trezor/product-components';

import { useSelector } from '#src/hooks/suite/useSelector';
import { type TokensWithRates } from '#src/utils/wallet/tokenUtils';

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
    const showNetworkIcon = useSelector(state =>
        selectShouldShowNetworkIcon(state, account.symbol, token.contract),
    );
    const isDisabled = !onClick;
    const contractAddress = toTokenAddress(token.contract);

    return (
        <ItemClickableContainer
            onClick={() => {
                onClick?.(token, account);
            }}
            padding={isInsideGroup ? { left: 16, vertical: 12, right: 16 } : undefined}
            isDisabled={isDisabled}
        >
            <Row data-testid={dataTestId} gap={12} overflow="hidden" flex="1" minWidth={0}>
                <AssetIcon
                    size={40}
                    networkSymbol={account.symbol}
                    contractAddress={contractAddress}
                    showNetworkIcon={showNetworkIcon}
                />
                <AssetDetails
                    networkSymbol={account.symbol}
                    contractAddress={contractAddress}
                    isDisabled={isDisabled}
                />
            </Row>
            {token.balance && (
                <Row flex="0 0 auto">
                    <AssetAmount
                        networkSymbol={account.symbol}
                        contractAddress={contractAddress}
                        amount={token.balance}
                        fiatAmount={
                            token.fiatRate ? asBaseCurrencyAmount(token.fiatValue) : undefined
                        }
                        showNoTradingPairText={showNoTradingPairText}
                        isFiatPrimary={isFiatPrimary}
                        isDisabled={isDisabled}
                    />
                </Row>
            )}
        </ItemClickableContainer>
    );
}
