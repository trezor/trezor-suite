import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { CoinmarketSelectedOffer } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketSelectedOffer';
import { useCoinmarketExchangeForm } from 'src/hooks/wallet/coinmarket/form/useCoinmarketExchangeForm';
import { CoinmarketContainer } from 'src/views/wallet/coinmarket/common/CoinmarketContainer';

const CoinmarketExchangeConfirmComponent = ({ selectedAccount }: UseCoinmarketProps) => {
    const coinmarketExchangeContextValues = useCoinmarketExchangeForm({
        selectedAccount,
        pageType: 'confirm',
    });

    return (
        <CoinmarketFormContext.Provider value={coinmarketExchangeContextValues}>
            <CoinmarketSelectedOffer />
        </CoinmarketFormContext.Provider>
    );
};

export const CoinmarketExchangeConfirm = () => (
    <CoinmarketContainer
        title="TR_COINMARKET_SWAP"
        backRoute="wallet-coinmarket-exchange"
        SectionComponent={CoinmarketExchangeConfirmComponent}
    />
);
