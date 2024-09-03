import { withSelectedAccountLoaded } from 'src/components/wallet';
import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { withCoinmarketLayoutWrap } from 'src/views/wallet/coinmarket/common/CoinmarketLayout/withCoinmarketLayoutWrap';
import { CoinmarketSelectedOffer } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketSelectedOffer';
import { useCoinmarketExchangeForm } from 'src/hooks/wallet/coinmarket/form/useCoinmarketExchangeForm';

const CoinmarketExchangeConfirmComponent = (props: UseCoinmarketProps) => {
    const coinmarketExchangeContextValues = useCoinmarketExchangeForm({
        ...props,
        pageType: 'confirm',
    });

    return (
        <CoinmarketFormContext.Provider value={coinmarketExchangeContextValues}>
            <CoinmarketSelectedOffer />
        </CoinmarketFormContext.Provider>
    );
};

export const CoinmarketExchangeConfirm = withSelectedAccountLoaded(
    withCoinmarketLayoutWrap(CoinmarketExchangeConfirmComponent, {
        backRoute: 'wallet-coinmarket-exchange',
    }),
    {
        title: 'TR_COINMARKET_SWAP',
    },
);
