import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { CoinmarketSelectedOffer } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketSelectedOffer';
import { useCoinmarketSellForm } from 'src/hooks/wallet/coinmarket/form/useCoinmarketSellForm';
import { CoinmarketContainer } from 'src/views/wallet/coinmarket/common/CoinmarketContainer';

const CoinmarketSellConfirmComponent = ({ selectedAccount }: UseCoinmarketProps) => {
    const coinmarketSellContextValues = useCoinmarketSellForm({
        selectedAccount,
        pageType: 'confirm',
    });

    return (
        <CoinmarketFormContext.Provider value={coinmarketSellContextValues}>
            <CoinmarketSelectedOffer />
        </CoinmarketFormContext.Provider>
    );
};

export const CoinmarketSellConfirm = () => (
    <CoinmarketContainer
        title="TR_NAV_SELL"
        backRoute="wallet-coinmarket-sell"
        SectionComponent={CoinmarketSellConfirmComponent}
    />
);
