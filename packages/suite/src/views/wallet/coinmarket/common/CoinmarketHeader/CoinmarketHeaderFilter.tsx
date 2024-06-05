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
    display: flex;
    flex-wrap: wrap;
`;

const SelectWrapper = styled(Select)`
    width: 254px;
    max-width: 100%;
    padding: ${spacingsPx.xxs} ${spacingsPx.md} ${spacingsPx.xxs} 0;
`;

const Option = styled.div`
    display: flex;
    align-items: center;
`;

interface CoinmarketHeaderFilterProps {
    quotesFilterReducer: UseCoinmarketFilterReducerOutputProps<any>;
}

const CoinmarketHeaderFilter = ({ quotesFilterReducer }: CoinmarketHeaderFilterProps) => {
    const { state, dispatch } = quotesFilterReducer;
    const { translationString } = useTranslation();
    const defaultMethod: PaymentMethodListProps = {
        value: '',
        label: translationString('TR_PAYMENT_METHOD_ALL'),
    };

    return (
        <Wrapper data-test="@coinmarket/buy/filter">
            <SelectWrapper
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

export default CoinmarketHeaderFilter;
