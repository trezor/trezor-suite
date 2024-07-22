import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { isCoinmarketSellOffers } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import CoinmarketFormInputAccount from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputAccount';
import CoinmarketFormInputCountry from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputCountry';
import CoinmarketFormInputFiatCrypto from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputFiatCrypto/CoinmarketFormInputFiatCrypto';
import CoinmarketFormInputPaymentMethod from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputPaymentMethod';

const CoinmarketFormInputs = () => {
    const context = useCoinmarketFormContext();

    if (isCoinmarketSellOffers(context)) {
        return (
            <>
                <CoinmarketFormInputAccount label="TR_COINMARKET_YOU_SELL" />
                <CoinmarketFormInputFiatCrypto />
                <CoinmarketFormInputPaymentMethod label="TR_COINMARKET_RECEIVE_METHOD" />
                <CoinmarketFormInputCountry label="TR_COINMARKET_COUNTRY" />
            </>
        );
    }

    return (
        <>
            <CoinmarketFormInputAccount label="TR_COINMARKET_YOU_BUY" />
            <CoinmarketFormInputFiatCrypto />
            <CoinmarketFormInputPaymentMethod label="TR_COINMARKET_PAYMENT_METHOD" />
            <CoinmarketFormInputCountry label="TR_COINMARKET_COUNTRY" />
        </>
    );
};

export default CoinmarketFormInputs;
