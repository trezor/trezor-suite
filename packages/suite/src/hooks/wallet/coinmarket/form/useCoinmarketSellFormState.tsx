import { getFeeLevels } from '@suite-common/wallet-utils';
import {
    CoinmarketUseSellFormStateProps,
    CoinmarketUseSellFormStateReturnProps,
} from 'src/types/coinmarket/coinmarketForm';

const useCoinmarketSellFormState = ({
    selectedAccount,
    fees,
    currentState,
    defaultFormValues,
}: CoinmarketUseSellFormStateProps): CoinmarketUseSellFormStateReturnProps | undefined => {
    // do not calculate if currentState is already set (prevent re-renders)
    if (selectedAccount.status !== 'loaded' || currentState) return;

    const { account, network } = selectedAccount;
    const coinFees = fees[account.symbol];
    const levels = getFeeLevels(account.networkType, coinFees);
    const feeInfo = { ...coinFees, levels };

    return {
        account,
        network,
        feeInfo,
        formValues: defaultFormValues,
    };
};

export default useCoinmarketSellFormState;
