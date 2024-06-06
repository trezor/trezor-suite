import CoinmarketFormInputAccount from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputAccount';
import CoinmarketFormInputCountry from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputCountry';
import CoinmarketFormInputFiatCrypto from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputFiatCrypto/CoinmarketFormInputFiatCrypto';
import CoinmarketFormInputPaymentMethod from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputPaymentMethod';

const CoinmarketFormInputs = () => {
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
