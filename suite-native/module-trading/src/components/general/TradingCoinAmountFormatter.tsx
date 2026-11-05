import { useSelector } from 'react-redux';

import type { CryptoId } from 'invity-api';

import {
    type TradingRootState,
    cryptoIdToNetworkAndContractAddress,
    selectTradingCoinSymbolByCryptoId,
} from '@suite-common/trading';
import type { TextProps } from '@suite-native/atoms';
import {
    ExactCryptoAmountFormatter,
    ExactTokenAmountFormatter,
    asDecimalTokenAmount,
} from '@suite-native/formatters';
import { TokenMetadataProvider } from '@suite-native/tokens';

export type TradingCoinAmountFormatterProps = TextProps & {
    cryptoId?: CryptoId;
    amount?: string;
};

export const TradingCoinAmountFormatter = ({
    amount,
    cryptoId,
    ...textProps
}: TradingCoinAmountFormatterProps) => {
    const coinSymbol = useSelector((state: TradingRootState) =>
        selectTradingCoinSymbolByCryptoId(state, cryptoId),
    );

    const { network, contractAddress } = cryptoIdToNetworkAndContractAddress(cryptoId);

    if (!coinSymbol || !network) {
        return null;
    }

    if (!contractAddress) {
        return (
            <ExactCryptoAmountFormatter
                value={amount ?? '0'}
                symbol={network.symbol}
                // Trading amounts must remain readable so the user can evaluate the trade.
                discreetMode="disabled"
                {...textProps}
            />
        );
    }

    return (
        <TokenMetadataProvider
            networkSymbol={network.symbol}
            tokens={[{ contract: contractAddress, symbol: coinSymbol }]}
        >
            <ExactTokenAmountFormatter
                networkSymbol={network.symbol}
                contractAddress={contractAddress}
                value={asDecimalTokenAmount(amount ?? '0')}
                // Trading amounts must remain readable so the user can evaluate the trade.
                discreetMode="disabled"
                {...textProps}
            />
        </TokenMetadataProvider>
    );
};
