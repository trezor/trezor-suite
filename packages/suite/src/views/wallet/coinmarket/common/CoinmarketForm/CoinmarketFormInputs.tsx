import CoinmarketFormInputAccount from './CoinmarketFormInput/CoinmarketFormInputAccount';
import CoinmarketFormInputCountry from './CoinmarketFormInput/CoinmarketFormInputCountry';
import CoinmarketFormInputFiat from './CoinmarketFormInput/CoinmarketFormInputFiat';
import CoinmarketFormInputPaymentMethod from './CoinmarketFormInput/CoinmarketFormInputPaymentMethod';

const CoinmarketFormInputs = () => {
    return (
        <>
            <CoinmarketFormInputAccount />
            <CoinmarketFormInputFiat />
            <CoinmarketFormInputPaymentMethod label="TR_COINMARKET_PAYMENT_METHOD" />
            <CoinmarketFormInputCountry />
        </>
    );
};

export default CoinmarketFormInputs;
