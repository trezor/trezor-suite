import React from 'react';
import { Translation } from '@suite-components';
import { useCoinmarketExchangeFormContext } from '@wallet-hooks/useCoinmarketExchangeForm';
import { Wrapper, FeesWrapper, NoProviders, FullWidthForm } from '@wallet-views/coinmarket';
import { CoinmarketSkeleton } from '@wallet-views/coinmarket/skeleton';
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
