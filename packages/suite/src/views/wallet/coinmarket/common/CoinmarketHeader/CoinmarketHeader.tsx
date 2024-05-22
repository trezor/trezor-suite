import { H2 } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { ExtendedMessageDescriptor } from 'src/types/suite';
import CoinmarketHeaderFilter from './CoinmarketHeaderFilter';
import { useCoinmarketBuyOffersContext } from 'src/hooks/wallet/useCoinmarketBuyOffers';
import { CoinmarketRefreshTime } from '..';
import { InvityAPIReloadQuotesAfterSeconds } from 'src/constants/wallet/coinmarket/metadata';
import CoinmarketHeaderSummary from './CoinmarketHeaderSummary';

interface CoinmarketHeaderProps {
    title: ExtendedMessageDescriptor['id'];
}

const CoinmarketHeader = ({ title }: CoinmarketHeaderProps) => {
    const { innerQuotesFilterReducer, timer } = useCoinmarketBuyOffersContext();

    return (
        <div>
            <div>
                <H2>
                    <Translation id={title} />
                </H2>
                <div>
                    <CoinmarketHeaderFilter quotesFilterReducer={innerQuotesFilterReducer} />
                </div>
                <div>
                    <CoinmarketRefreshTime
                        isLoading={timer.isLoading}
                        refetchInterval={InvityAPIReloadQuotesAfterSeconds}
                        seconds={timer.timeSpend.seconds}
                        label={<Translation id="TR_BUY_OFFERS_REFRESH" />}
                    />
                </div>

                <div>
                    <CoinmarketHeaderSummary />
                </div>
            </div>
        </div>
    );
};

export default CoinmarketHeader;
