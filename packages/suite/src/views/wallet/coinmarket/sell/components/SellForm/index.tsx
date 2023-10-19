import { useCoinmarketSellFormContext } from 'src/hooks/wallet/useCoinmarketSellForm';
import { Translation } from 'src/components/suite';
import { Wrapper, FeesWrapper, NoProviders } from 'src/views/wallet/coinmarket';
import { CoinmarketSkeleton } from 'src/views/wallet/coinmarket/skeleton';

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
