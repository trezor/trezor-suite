import { nativeTypography, spacingsPx } from '@trezor/theme';
import { useSelector } from 'src/hooks/suite';
import { selectLanguage } from 'src/reducers/suite/suiteReducer';
import {
    CoinmarketAmountContainer,
    CoinmarketAmountWrapper,
    CoinmarketAmountWrapperText,
} from 'src/views/wallet/coinmarket';
import { CoinmarketFormInputCurrency } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputCurrency';
import styled from 'styled-components';

const CoinmarketFormInputCurrencyWrapper = styled.div`
    color: ${({ theme }) => theme.textDefault};
    width: 84px;

    /* stylelint-disable selector-class-pattern */
    .react-select__control {
        padding: ${spacingsPx.xxxs} ${spacingsPx.xs} 0;
        font-size: ${nativeTypography.titleSmall.fontSize}px;
        border-radius: 18px;
    }

    .react-select__indicators {
        right: 8px;
    }
`;

interface CoinmarketFormOfferFiatAmountProps {
    amount: string | undefined;
}

export const CoinmarketFormOfferFiatAmount = ({ amount }: CoinmarketFormOfferFiatAmountProps) => {
    const locale = useSelector(selectLanguage);
    const formattedAmount = amount ? new Intl.NumberFormat(locale).format(Number(amount)) : '';

    return (
        <CoinmarketAmountContainer>
            <CoinmarketAmountWrapper>
                <CoinmarketAmountWrapperText title={formattedAmount}>
                    {formattedAmount}
                </CoinmarketAmountWrapperText>
            </CoinmarketAmountWrapper>
            <CoinmarketFormInputCurrencyWrapper>
                <CoinmarketFormInputCurrency isClean={false} size="small" isDarkLabel={true} />
            </CoinmarketFormInputCurrencyWrapper>
        </CoinmarketAmountContainer>
    );
};
