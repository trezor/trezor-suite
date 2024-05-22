import { H2 } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { ExtendedMessageDescriptor } from 'src/types/suite';
import CoinmarketHeaderFilter from './CoinmarketHeaderFilter';
import { useCoinmarketBuyOffersContext } from 'src/hooks/wallet/useCoinmarketBuyOffers';
import { CoinmarketRefreshTime } from '..';
import { InvityAPIReloadQuotesAfterSeconds } from 'src/constants/wallet/coinmarket/metadata';
import CoinmarketHeaderSummary from './CoinmarketHeaderSummary';
import styled from 'styled-components';
import { spacingsPx } from '@trezor/theme';

const Header = styled.div`
    padding-top: ${spacingsPx.md};
`;

const HeaderTop = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const HeaderH2 = styled(H2)`
    flex: auto;
    width: 100%;
`;

const HeaderBottom = styled.div`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    margin-top: ${spacingsPx.xl};
`;

const HeaderCoinmarketRefreshTime = styled.div`
    margin-left: auto;
    padding-left: ${spacingsPx.lg};
`;

interface CoinmarketHeaderProps {
    title: ExtendedMessageDescriptor['id'];
    titleTimer: ExtendedMessageDescriptor['id'];
    showTimerNextToTitle?: boolean;
}

const CoinmarketHeader = ({ title, titleTimer, showTimerNextToTitle }: CoinmarketHeaderProps) => {
    const { innerQuotesFilterReducer, timer } = useCoinmarketBuyOffersContext();

    const Timer = () => (
        <CoinmarketRefreshTime
            isLoading={timer.isLoading}
            refetchInterval={InvityAPIReloadQuotesAfterSeconds}
            seconds={timer.timeSpend.seconds}
            label={<Translation id={titleTimer} />}
        />
    );

    return (
        <Header>
            <HeaderTop>
                <HeaderH2>
                    <Translation id={title} />
                </HeaderH2>
                {showTimerNextToTitle && <Timer />}
            </HeaderTop>
            <HeaderBottom>
                <CoinmarketHeaderFilter quotesFilterReducer={innerQuotesFilterReducer} />
                <CoinmarketHeaderSummary />
                {!showTimerNextToTitle && (
                    <HeaderCoinmarketRefreshTime>
                        <Timer />
                    </HeaderCoinmarketRefreshTime>
                )}
            </HeaderBottom>
        </Header>
    );
};

export default CoinmarketHeader;
