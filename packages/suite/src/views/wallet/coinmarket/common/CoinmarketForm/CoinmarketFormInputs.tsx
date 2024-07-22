import { spacingsPx } from '@trezor/theme';
import { Fees } from 'src/components/wallet/Fees/Fees';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { isCoinmarketSellOffers } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import CoinmarketFormInputAccount from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputAccount';
import CoinmarketFormInputCountry from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputCountry';
import CoinmarketFormInputFiatCrypto from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputFiatCrypto/CoinmarketFormInputFiatCrypto';
import CoinmarketFormInputPaymentMethod from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputPaymentMethod';
import styled from 'styled-components';

const CoinmarketFeesWrapper = styled.div`
    margin-bottom: ${spacingsPx.md};
`;

const CoinmarketFormInputs = () => {
    const context = useCoinmarketFormContext();

    if (isCoinmarketSellOffers(context)) {
        const {
            control,
            feeInfo,
            account,
            composedLevels,
            formState: { errors },
            register,
            setValue,
            getValues,
            changeFeeLevel,
        } = context;

        return (
            <>
                <CoinmarketFormInputAccount label="TR_COINMARKET_YOU_SELL" />
                <CoinmarketFormInputFiatCrypto />
                <CoinmarketFeesWrapper>
                    <Fees
                        control={control}
                        feeInfo={feeInfo}
                        account={account}
                        composedLevels={composedLevels}
                        errors={errors}
                        register={register}
                        setValue={setValue}
                        getValues={getValues}
                        changeFeeLevel={changeFeeLevel}
                    />
                </CoinmarketFeesWrapper>
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
