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
    networkSymbol: NetworkSymbol;
    symbol?: TokenSymbol;
    balance?: string;
    name?: string;
    decimals?: number;
    contract: TokenAddress;
};

export const TokenInfoCard = ({
    networkSymbol,
    symbol,
    balance,
    name,
    decimals,
    contract,
}: TokenInfoCardProps) => {
    const isSpecificCoinDefinitionKnown = useSelector((state: TokenDefinitionsRootState) =>
        selectIsSpecificCoinDefinitionKnown(state, networkSymbol, contract),
    );

    if (!symbol || !balance || !name || !isSpecificCoinDefinitionKnown) return null;

    return (
        <AccountImportOverviewCard
            coinName={name}
            symbol={networkSymbol}
            shouldDisplayDeleteIcon={false}
            cryptoAmount={
                <TokenAmountFormatter
                    value={balance}
                    symbol={symbol}
                    decimals={decimals}
                    variant="label"
                />
            }
            icon={<CryptoIcon symbol={contract} />}
        >
            <TokenToFiatAmountFormatter
                networkSymbol={networkSymbol}
                value={balance}
                contract={contract}
                decimals={decimals}
            />
        </AccountImportOverviewCard>
    );
};
