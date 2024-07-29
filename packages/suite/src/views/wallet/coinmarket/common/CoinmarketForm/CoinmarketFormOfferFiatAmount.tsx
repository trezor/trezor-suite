import { nativeTypography, spacingsPx } from '@trezor/theme';
import {
    CoinmarketAmountContainer,
    CoinmarketAmountWrapper,
    CoinmarketAmountWrapperText,
} from 'src/views/wallet/coinmarket';
import CoinmarketFormInputCurrency from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputCurrency';
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

const CoinmarketFormOfferFiatAmount = ({ amount }: CoinmarketFormOfferFiatAmountProps) => {
    const formattedAmount = amount?.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') ?? '';

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

export default CoinmarketFormOfferFiatAmount;
