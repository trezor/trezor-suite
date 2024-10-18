import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { useCoinmarketBuyForm } from 'src/hooks/wallet/coinmarket/form/useCoinmarketBuyForm';
import { CoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { CoinmarketSelectedOffer } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketSelectedOffer';
import { CoinmarketContainer } from 'src/views/wallet/coinmarket/common/CoinmarketContainer';

const CoinmarketBuyConfirmComponent = ({ selectedAccount }: UseCoinmarketProps) => {
    const coinmarketBuyContextValues = useCoinmarketBuyForm({
        selectedAccount,
        pageType: 'confirm',
    });

    return (
        <CoinmarketFormContext.Provider value={coinmarketBuyContextValues}>
            <CoinmarketSelectedOffer />
        </CoinmarketFormContext.Provider>
    );
};

export const CoinmarketBuyConfirm = () => (
    <CoinmarketContainer
        title="TR_COINMARKET_BUY_AND_SELL"
        backRoute="wallet-coinmarket-buy"
        SectionComponent={CoinmarketBuyConfirmComponent}
    />
);
