import { useSelector } from 'react-redux';

import { FiatRatesRootState, WalletSettingsRootState } from '@suite-common/wallet-core';

import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { TradingRootState } from '../../../reducers';
import { selectAmountInBaseFiatCurrency } from '../../../selectors/commonSelectors';
import { TradeableAsset } from '../../../types/general';
import { FiatAmountBadge } from '../../general/FiatAmountBadge';

type ExchangeSendFiatAmountBadgeProps = {
    amount: string;
    asset: TradeableAsset;
};

const ExchangeSendFiatAmountBadge = ({ amount, asset }: ExchangeSendFiatAmountBadgeProps) => {
    const fiatAmount = useSelector(
        (state: FiatRatesRootState & WalletSettingsRootState & TradingRootState) =>
            selectAmountInBaseFiatCurrency(state, asset, amount),
    );

    return <FiatAmountBadge amount={fiatAmount} />;
};

export const ExchangeSendAmountBadge = () => {
    const { watch } = useExchangeFormContext();

    const [asset, amount] = watch(['sendAsset', 'sendCryptoAmount']);

    if (!asset || !amount) {
        return null;
    }

    return <ExchangeSendFiatAmountBadge amount={amount} asset={asset} />;
};
