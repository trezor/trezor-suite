import { H2 } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { ExtendedMessageDescriptor } from 'src/types/suite';
import CoinmarketHeaderFilter from './CoinmarketHeaderFilter';
import { CoinmarketRefreshTime } from '..';
import { InvityAPIReloadQuotesAfterSeconds } from 'src/constants/wallet/coinmarket/metadata';
import CoinmarketHeaderSummary from './CoinmarketHeaderSummary';
import styled from 'styled-components';
import { spacingsPx } from '@trezor/theme';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';
import {
    isCoinmarketBuyOffers,
    useCoinmarketOffersContext,
} from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { getCryptoQuoteAmountProps } from 'src/utils/wallet/coinmarket/coinmarketTypingUtils';

const Header = styled.div`
    padding-top: ${spacingsPx.sm};
    padding-bottom: ${spacingsPx.xs};
`;

const HeaderTop = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;

    ${SCREEN_QUERY.BELOW_TABLET} {
        flex-direction: column;
        align-items: flex-start;
    }
`;

const HeaderH2 = styled(H2)`
    flex: auto;
    width: 100%;

    ${SCREEN_QUERY.BELOW_TABLET} {
        padding-bottom: ${spacingsPx.xs};
    }
`;

const HeaderBottom = styled.div`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    margin-top: ${spacingsPx.xl};

    ${SCREEN_QUERY.BELOW_TABLET} {
        flex-direction: column;
        align-items: flex-start;
        margin-top: 0;
    }
`;

const HeaderCoinmarketRefreshTime = styled.div`
    margin-left: auto;
    padding: ${spacingsPx.xxs} 0 ${spacingsPx.xxs} ${spacingsPx.lg};

    ${SCREEN_QUERY.MOBILE} {
        order: -2;
        margin-left: 0;
        padding: ${spacingsPx.xxs} 0;
    }
`;

const CoinmarketHeaderSummaryWrap = styled(CoinmarketHeaderSummary)`
    ${SCREEN_QUERY.BELOW_TABLET} {
        order: -1;
    }
`;

interface CoinmarketHeaderProps {
    title: ExtendedMessageDescriptor['id'];
    titleTimer: ExtendedMessageDescriptor['id'];
    showTimerNextToTitle?: boolean;
}

const CoinmarketHeader = ({ title, titleTimer, showTimerNextToTitle }: CoinmarketHeaderProps) => {
    const context = useCoinmarketOffersContext();
    const { timer, quotes, quotesRequest } = context;
    const headerProps = getCryptoQuoteAmountProps(quotes?.[0], context);

    if (!headerProps || !quotesRequest) return null;

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
                {isCoinmarketBuyOffers(context) && <CoinmarketHeaderFilter />}
                <CoinmarketHeaderSummaryWrap {...headerProps} />
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
