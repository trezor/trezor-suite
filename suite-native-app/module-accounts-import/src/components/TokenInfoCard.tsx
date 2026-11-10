import { useSelector } from 'react-redux';

import { useTokenMetadata } from '@suite-common/token';
import {
    type TokenDefinitionsRootState,
    selectIsSpecificCoinDefinitionKnown,
} from '@suite-common/token-definitions';
import { type TokenAddress, toTokenSymbol } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    ExactTokenAmountFormatter,
    TokenToFiatAmountFormatter,
    convertTokenValueToDecimal,
} from '@suite-native/formatters';
import { TokenIcon } from '@suite-native/tokens';

import { AccountImportOverviewCard } from './AccountImportOverviewCard';

type TokenInfoCardProps = {
    symbol: NetworkSymbol;
    balance?: string;
    contract: TokenAddress;
};

export const TokenInfoCard = ({ symbol, balance, contract }: TokenInfoCardProps) => {
    const token = useTokenMetadata(symbol, contract);
    const isSpecificCoinDefinitionKnown = useSelector((state: TokenDefinitionsRootState) =>
        selectIsSpecificCoinDefinitionKnown(state, symbol, contract),
    );

    if (!token?.symbol || !balance || !token.name || !isSpecificCoinDefinitionKnown) return null;

    const { name, decimals } = token;

    return (
        <AccountImportOverviewCard
            coinName={name}
            cryptoAmount={
                <ExactTokenAmountFormatter
                    value={convertTokenValueToDecimal(balance, decimals ?? 0)}
                    tokenSymbol={toTokenSymbol(token.symbol)}
                    maxDisplayedDecimals={decimals}
                    variant="body-xs"
                />
            }
            icon={<TokenIcon networkSymbol={symbol} contractAddress={contract} />}
        >
            <TokenToFiatAmountFormatter
                symbol={symbol}
                value={balance}
                contract={contract}
                decimals={decimals}
            />
        </AccountImportOverviewCard>
    );
};
