import {
    TRADING_DEFAULT_CRYPTO_CURRENCY,
    type TradingFiatRatesProps,
    type TradingFiatRatesReturn,
    cryptoIdToNetworkAndContractAddress,
    useTradingFiatValues as useCommonTradingFiatValues,
} from '@suite-common/trading';

import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';

type SuiteTradingFiatRatesProps = Omit<TradingFiatRatesProps, 'shouldSendInSats'>;

export const useTradingFiatValues = ({
    cryptoId,
    ...rest
}: SuiteTradingFiatRatesProps): TradingFiatRatesReturn | null => {
    const { network } = cryptoIdToNetworkAndContractAddress(cryptoId);
    const symbol = network?.symbol ?? TRADING_DEFAULT_CRYPTO_CURRENCY;

    const { shouldSendInSats } = useBitcoinAmountUnit(symbol);

    return useCommonTradingFiatValues({ ...rest, cryptoId, shouldSendInSats });
};
