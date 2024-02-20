import styled from 'styled-components';
import { Translation } from 'src/components/suite';
import { useCoinmarketBuyFormContext } from 'src/hooks/wallet/useCoinmarketBuyForm';
import { Wrapper, NoProviders } from 'src/views/wallet/coinmarket';
import { CoinmarketSkeleton } from 'src/views/wallet/coinmarket/skeleton';

import Inputs from './Inputs';
import Footer from './Footer';

const Form = styled.form`
    width: 100%;
`;

const BuyForm = () => {
    const { onSubmit, handleSubmit, isLoading, noProviders } = useCoinmarketBuyFormContext();

    return (
        <Wrapper responsiveSize="LG">
            {isLoading && <CoinmarketSkeleton />}
            {!isLoading && noProviders && (
                <NoProviders>
                    <Translation id="TR_BUY_NO_PROVIDERS" />
                </NoProviders>
            )}
            {!isLoading && !noProviders && (
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Inputs />
                    <Footer />
                </Form>
            )}
        </Wrapper>
    );
};

export default BuyForm;
