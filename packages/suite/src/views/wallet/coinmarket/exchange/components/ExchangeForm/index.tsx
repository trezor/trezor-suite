import React from 'react';
import { Translation } from 'src/components/suite';
import { useCoinmarketExchangeFormContext } from 'src/hooks/wallet/useCoinmarketExchangeForm';
import { Wrapper, FeesWrapper, NoProviders, FullWidthForm } from 'src/views/wallet/coinmarket';
import { CoinmarketSkeleton } from 'src/views/wallet/coinmarket/skeleton';
import Inputs from './Inputs';
import Fees from './Fees';
import Footer from './Footer';

const CoinmarketExchangeForm = () => {
    const { onSubmit, handleSubmit, isLoading, noProviders } = useCoinmarketExchangeFormContext();

    return (
        <Wrapper responsiveSize="LG">
            {isLoading && <CoinmarketSkeleton />}
            {!isLoading && noProviders && (
                <NoProviders>
                    <Translation id="TR_EXCHANGE_NO_PROVIDERS" />
                </NoProviders>
            )}
            {!isLoading && !noProviders && (
                <FullWidthForm onSubmit={handleSubmit(onSubmit)}>
                    <Inputs />
                    <FeesWrapper>
                        <Fees />
                    </FeesWrapper>
                    <Footer />
                </FullWidthForm>
            )}
        </Wrapper>
    );
};

export default CoinmarketExchangeForm;
