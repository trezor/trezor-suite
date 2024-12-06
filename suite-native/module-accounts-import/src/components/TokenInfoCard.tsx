import { useSelector } from 'react-redux';

import { CryptoIcon } from '@suite-native/icons';
import {
    TokenDefinitionsRootState,
    selectIsSpecificCoinDefinitionKnown,
} from '@suite-common/token-definitions';
import { TokenAddress, TokenSymbol } from '@suite-common/wallet-types';
import { TokenAmountFormatter, TokenToFiatAmountFormatter } from '@suite-native/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';

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
        <AccountImportOverviewCard
            coinName={name}
            cryptoAmount={
                <TokenAmountFormatter
                    value={balance}
                    tokenSymbol={tokenSymbol}
                    decimals={decimals}
                    variant="label"
                />
            }
            icon={<CryptoIcon symbol={symbol} contractAddress={contract} />}
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
