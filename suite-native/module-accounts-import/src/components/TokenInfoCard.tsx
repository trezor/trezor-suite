import { useSelector } from 'react-redux';

import {
    type TokenDefinitionsRootState,
    selectIsSpecificCoinDefinitionKnown,
} from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';
import {
    ExactTokenAmountFormatter,
    TokenToFiatAmountFormatter,
    convertTokenValueToDecimal,
} from '@suite-native/formatters';
import { TokenIcon } from '@suite-native/icons';
import { TokenMetadataProvider } from '@suite-native/tokens';

import { AccountImportOverviewCard } from './AccountImportOverviewCard';

type TokenInfoCardProps = {
    symbol: NetworkSymbol;
    tokenSymbol?: TokenSymbol;
    balance?: string;
    name?: string;
    decimals?: number;
    contract: TokenAddress;
};

export const TokenInfoCard = ({
    symbol,
    tokenSymbol,
    balance,
    name,
    decimals,
    contract,
}: TokenInfoCardProps) => {
    const isSpecificCoinDefinitionKnown = useSelector((state: TokenDefinitionsRootState) =>
        selectIsSpecificCoinDefinitionKnown(state, symbol, contract),
    );

    if (!tokenSymbol || !balance || !name || !isSpecificCoinDefinitionKnown) return null;

    return (
        <TokenMetadataProvider
            networkSymbol={symbol}
            tokens={[{ contract, name, symbol: tokenSymbol, decimals }]}
        >
            <AccountImportOverviewCard
                coinName={name}
                cryptoAmount={
                    <ExactTokenAmountFormatter
                        value={convertTokenValueToDecimal(balance, decimals ?? 0)}
                        networkSymbol={symbol}
                        contractAddress={contract}
                        variant="body-xs"
                    />
                }
                icon={
                    <TokenIcon
                        networkSymbol={symbol}
                        contractAddress={contract}
                        tokenSymbol={tokenSymbol || name}
                    />
                }
            >
                <TokenToFiatAmountFormatter
                    symbol={symbol}
                    value={balance}
                    contract={contract}
                    decimals={decimals}
                />
            </AccountImportOverviewCard>
        </TokenMetadataProvider>
    );
};
