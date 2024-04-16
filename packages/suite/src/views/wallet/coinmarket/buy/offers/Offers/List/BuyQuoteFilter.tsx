import { Select } from '@trezor/components';
import { BuyCryptoPaymentMethod, BuyTrade } from 'invity-api';
import styled from 'styled-components';
import { CoinmarketPaymentType } from 'src/views/wallet/coinmarket/common';
//import { useCoinmarketExchangeFormContext } from 'src/hooks/wallet/useCoinmarketExchangeForm';
import { useMemo, useState } from 'react';
import { useTranslation } from 'src/hooks/suite';

const Wrapper = styled.div`
    margin-top: 20px;
`;

const Option = styled.div`
    display: flex;
    align-items: center;
`;

interface BuyQuoteFilter {
    quotes: BuyTrade[];
}

interface PaymentMethodListProps {
    value: BuyCryptoPaymentMethod | '';
    label: string;
}

export const BuyQuoteFilter = ({ quotes }: BuyQuoteFilter) => {
    const { translationString } = useTranslation();
    const defaultMethod: PaymentMethodListProps = {
        value: '',
        label: translationString('TR_PAYMENT_METHOD_ALL'),
    };
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethodListProps>(defaultMethod);

    const paymentMethods = useMemo(() => {
        const array: PaymentMethodListProps[] = [];

        quotes.forEach(quote => {
            const { paymentMethod } = quote;
            const isNotInArray = !array.some(item => item.value === paymentMethod);

            if (typeof paymentMethod !== 'undefined' && isNotInArray) {
                const label = quote.paymentMethodName ?? paymentMethod;

                array.push({ value: paymentMethod, label });
            }
        });

        return array;
    }, [quotes]);

    return (
        <Wrapper data-test="@coinmarket/buy/filter">
            <Select
                onChange={(selected: PaymentMethodListProps) => {
                    setPaymentMethod(selected);
                }}
                value={paymentMethod}
                options={[defaultMethod, ...paymentMethods]}
                formatOptionLabel={(option: PaymentMethodListProps) => (
                    <Option>
                        {option.value !== '' ? (
                            <CoinmarketPaymentType
                                method={option.value}
                                methodName={option.label}
                            />
                        ) : (
                            <div>{option.label}</div>
                        )}
                    </Option>
                )}
                data-test="@coinmarket/buy/filter-payment-method"
                minValueWidth="100px"
                isSearchable
                isClearable={false}
                isDisabled={false}
            />
        </Wrapper>
    );
};
