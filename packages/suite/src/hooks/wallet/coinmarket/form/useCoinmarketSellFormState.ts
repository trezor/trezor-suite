import { getFeeLevels } from '@suite-common/wallet-utils';
import {
    CoinmarketUseSellFormStateProps,
    CoinmarketUseSellFormStateReturnProps,
} from 'src/types/coinmarket/coinmarketForm';

export const useCoinmarketSellFormState = ({
    account,
    network,
    fees,
    defaultValues,
}: CoinmarketUseSellFormStateProps): CoinmarketUseSellFormStateReturnProps | undefined => {
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
