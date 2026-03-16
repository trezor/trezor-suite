import { useSelector } from 'react-redux';

import {
    type TokenDefinitionsRootState,
    selectIsSpecificCoinDefinitionKnown,
} from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';
import { TokenAmountFormatter, TokenToFiatAmountFormatter } from '@suite-native/formatters';
import { CryptoIcon } from '@suite-native/icons';

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
                    variant="body-xs"
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
