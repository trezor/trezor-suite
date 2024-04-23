import { Select } from '@trezor/components';
import styled from 'styled-components';
import { useTranslation } from 'src/hooks/suite';
import {
    PaymentMethodListProps,
    UseCoinmarketFilterReducerOutputProps,
} from 'src/reducers/wallet/useCoinmarketFilterReducer';
import { CoinmarketPaymentPlainType } from 'src/views/wallet/coinmarket/common/CoinmarketPaymentPlainType';
import { spacingsPx } from '@trezor/theme';

const Wrapper = styled.div`
    margin-top: ${spacingsPx.lg};
`;

const Option = styled.div`
    display: flex;
    align-items: center;
`;

interface BuyQuoteFilter {
    quotesFilterReducer: UseCoinmarketFilterReducerOutputProps;
}

export const BuyQuoteFilter = ({ quotesFilterReducer }: BuyQuoteFilter) => {
    const { state, dispatch } = quotesFilterReducer;
    const { translationString } = useTranslation();
    const defaultMethod: PaymentMethodListProps = {
        value: '',
        label: translationString('TR_PAYMENT_METHOD_ALL'),
    };

    return (
        <Wrapper data-test="@coinmarket/buy/filter">
            <Select
                onChange={(selected: PaymentMethodListProps) => {
                    dispatch({ type: 'FILTER_PAYMENT_METHOD', payload: selected.value });
                }}
                value={
                    state.paymentMethods.find(item => item.value === state.paymentMethod) ??
                    defaultMethod
                }
                options={[defaultMethod, ...state.paymentMethods]}
                formatOptionLabel={(option: PaymentMethodListProps) => (
                    <Option>
                        {option.value !== '' ? (
                            <CoinmarketPaymentPlainType
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
            />
        </Wrapper>
    );
};
