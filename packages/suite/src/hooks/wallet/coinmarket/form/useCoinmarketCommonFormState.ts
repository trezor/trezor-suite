import { getFeeLevels } from '@suite-common/wallet-utils';
import {
    CoinmarketExchangeFormProps,
    CoinmarketSellFormProps,
    CoinmarketUseCommonFormStateProps,
    CoinmarketUseCommonFormStateReturnProps,
} from 'src/types/coinmarket/coinmarketForm';

export const useCoinmarketCommonFormState = <
    T extends CoinmarketSellFormProps | CoinmarketExchangeFormProps,
>({
    account,
    network,
    fees,
    defaultValues,
}: CoinmarketUseCommonFormStateProps<T>): CoinmarketUseCommonFormStateReturnProps<T> => {
    const coinFees = fees[account.symbol];
    const levels = getFeeLevels(account.networkType, coinFees);
    const feeInfo = { ...coinFees, levels };

    return {
        account,
        network,
        feeInfo,
        formValues: defaultValues,
    };
};
