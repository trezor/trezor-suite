import styled from 'styled-components';
import { spacingsPx } from '@trezor/theme';
import CoinmarketFormInputPaymentMethod from '../CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputPaymentMethod';

const Wrapper = styled.div`
    display: flex;
    flex-wrap: wrap;
`;

const SelectWrapper = styled(CoinmarketFormInputPaymentMethod)`
    width: 254px;
    max-width: 100%;
    padding: ${spacingsPx.xxs} ${spacingsPx.md} ${spacingsPx.xxs} 0;
`;

const CoinmarketHeaderFilter = () => {
    return (
        <Wrapper data-test="@coinmarket/buy/filter">
            <SelectWrapper />
        </Wrapper>
    );
};

export default CoinmarketHeaderFilter;
