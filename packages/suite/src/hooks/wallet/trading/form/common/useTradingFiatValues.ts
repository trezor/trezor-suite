import { useServices } from '@suite-common/dependency-injection';
import {
    TRADING_DEFAULT_CRYPTO_CURRENCY,
    type TradingFiatRatesProps,
    type TradingFiatRatesReturn,
    cryptoIdToNetworkAndContractAddress,
    useTradingFiatValues as useCommonTradingFiatValues,
} from '@suite-common/trading';
import { selectNetworkConfigDeps } from '@suite-common/wallet-config';

import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';

type SuiteTradingFiatRatesProps = Omit<TradingFiatRatesProps, 'shouldSendInSats'>;

export const useTradingFiatValues = ({
    cryptoId,
    ...rest
}: SuiteTradingFiatRatesProps): TradingFiatRatesReturn | null => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);
    const { network } = cryptoIdToNetworkAndContractAddress(networkConfigDeps, cryptoId);
    const symbol = network?.symbol ?? TRADING_DEFAULT_CRYPTO_CURRENCY;

    const { isBtcSatsAmountUnit: shouldSendInSats } = useBitcoinAmountUnit(symbol);

    return useCommonTradingFiatValues({ ...rest, cryptoId, shouldSendInSats });
};
