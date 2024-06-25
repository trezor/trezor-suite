import styled from 'styled-components';
import { spacingsPx } from '@trezor/theme';
import CoinmarketFormInputPaymentMethod from '../CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputPaymentMethod';
import CoinmarketFormInputCountry from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputCountry';
import CoinmarketFormInputFiat from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputFiat';

const Wrapper = styled.div`
    display: flex;
    flex-wrap: wrap;
`;

const SelectWrapper = `
    width: 254px;
    max-width: 100%;
    padding: ${spacingsPx.xxs} ${spacingsPx.md} ${spacingsPx.xxs} 0;
`;

const CoinmarketFormInputFiatWrapper = styled(CoinmarketFormInputFiat)`
    ${SelectWrapper}
`;

const CoinmarketFormInputPaymentMethodWrapper = styled(CoinmarketFormInputPaymentMethod)`
    ${SelectWrapper}
`;

const CoinmarketFormInputCountryWrapper = styled(CoinmarketFormInputCountry)`
    ${SelectWrapper}
`;

const CoinmarketHeaderFilter = () => {
    return (
        <Wrapper data-test="@coinmarket/filter">
            <CoinmarketFormInputFiatWrapper />
            <CoinmarketFormInputPaymentMethodWrapper />
            <CoinmarketFormInputCountryWrapper />
        </Wrapper>
    );
};

export default CoinmarketHeaderFilter;
