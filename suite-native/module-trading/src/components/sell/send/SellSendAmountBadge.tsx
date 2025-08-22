import { useSelector } from 'react-redux';

import { selectTradingSellIsLoading } from '@suite-common/trading';
import { FiatRatesRootState, WalletSettingsRootState } from '@suite-common/wallet-core';
import { Badge } from '@suite-native/atoms';
import { useField } from '@suite-native/forms';

import { useSellFormContext } from '../../../hooks/sell/useSellFormContext';
import { TradingRootState } from '../../../reducers';
import { selectAmountInBaseFiatCurrency } from '../../../selectors/commonSelectors';
import { TradeableAsset } from '../../../types/general';
import { FiatAmountBadge } from '../../general/FiatAmountBadge';

type SellSendFiatAmountBadgeProps = {
    amount: string;
    asset: TradeableAsset;
};

const SellSendFiatAmountBadge = ({ amount, asset }: SellSendFiatAmountBadgeProps) => {
    const fiatAmount = useSelector(
        (state: FiatRatesRootState & WalletSettingsRootState & TradingRootState) =>
            selectAmountInBaseFiatCurrency(state, asset, amount),
    );

    return <FiatAmountBadge amount={fiatAmount} />;
};

export const SellSendAmountBadge = () => {
    const { watch } = useSellFormContext();
    const isLoading = useSelector(selectTradingSellIsLoading);

    const { errorMessage, hasError, value } = useField({ name: 'cryptoStringAmount' });
    if (!isLoading && hasError) {
        return <Badge label={errorMessage} variant="red" size="small" />;
    }

    const asset = watch('sendAsset');
    if (!asset || !value) {
        return null;
    }

    return <SellSendFiatAmountBadge amount={value} asset={asset} />;
};
