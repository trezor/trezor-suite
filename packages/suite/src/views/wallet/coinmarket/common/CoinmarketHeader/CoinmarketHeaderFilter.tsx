import styled from 'styled-components';
import { spacingsPx } from '@trezor/theme';
import CoinmarketFormInputPaymentMethod from '../CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputPaymentMethod';
import CoinmarketFormInputCountry from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputCountry';
import CoinmarketFormInputFiatCrypto from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputFiatCrypto/CoinmarketFormInputFiatCrypto';

const Wrapper = styled.div`
    display: flex;
    flex-wrap: wrap;
`;

const SelectWrapper = `
    width: 254px;
    max-width: 100%;
    padding: ${spacingsPx.xxs} ${spacingsPx.md} ${spacingsPx.xxs} 0;
`;

const CoinmarketFormInputFiatWrapper = styled(CoinmarketFormInputFiatCrypto)`
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
            <CoinmarketFormInputFiatWrapper showLabel={false} />
            <CoinmarketFormInputPaymentMethodWrapper />
            <CoinmarketFormInputCountryWrapper />
        </Wrapper>
    );
};

export default CoinmarketHeaderFilter;
