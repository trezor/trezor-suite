import React from 'react';
import { useCoinmarketSellFormContext } from '@wallet-hooks/useCoinmarketSellForm';
import { Translation } from '@suite-components';
import { Wrapper, FeesWrapper, NoProviders } from '@wallet-views/coinmarket';
import { CoinmarketSkeleton } from '@wallet-views/coinmarket/skeleton';

import Inputs from './Inputs';
import Footer from './Footer';
import Fees from './Fees';

const SellForm = () => {
    const { onSubmit, handleSubmit, isLoading, noProviders } = useCoinmarketSellFormContext();

    return (
        <Wrapper responsiveSize="LG">
            {isLoading && <CoinmarketSkeleton />}
            {!isLoading && noProviders && (
                <NoProviders>
                    <Translation id="TR_SELL_NO_PROVIDERS" />
                </NoProviders>
            )}
            {!isLoading && !noProviders && (
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Inputs />
                    <FeesWrapper>
                        <Fees />
                    </FeesWrapper>
                    <Footer />
                </form>
            )}
        </Wrapper>
    );
};

export default SellForm;
