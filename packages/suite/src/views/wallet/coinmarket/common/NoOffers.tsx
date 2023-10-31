import styled from 'styled-components';

import { Translation } from 'src/components/suite';
import { Button, Image } from '@trezor/components';
import { InvityAPIReloadQuotesAfterSeconds } from 'src/constants/wallet/coinmarket/metadata';
import { CoinmarketRefreshTime } from './CoinmarketRefreshTime';

const NoOffersWrapper = styled.div`
    display: flex;
    justify-content: center;
    flex-direction: column;
    min-height: 300px;
    align-items: center;
    flex: 1;
`;

const NoOffersImage = styled.div`
    padding-bottom: 40px;
`;

const NoOffersHeader = styled.h3`
    padding-bottom: 20px;
`;
const NoOffersMessage = styled.span``;

const CoinmarketRefreshTimeWrapper = styled.div`
    margin-top: 20px;
`;

const ButtonsWrapper = styled.div`
    margin-top: 20px;
    display: flex;
    justify-content: space-between;

    & > * + * {
        margin-left: 12px;
    }
`;

interface NoOffersProps {
    coinmarketRefreshTimeIsLoading: boolean;
    coinmarketRefreshTimeSeconds: number;
    onBackButtonClick: () => void;
    onReloadOffersButtonClick: () => void;
    hasLoadingFailed: boolean;
}

export const NoOffers = ({
    coinmarketRefreshTimeIsLoading,
    coinmarketRefreshTimeSeconds,
    onBackButtonClick,
    onReloadOffersButtonClick,
    hasLoadingFailed,
}: NoOffersProps) => (
    <NoOffersWrapper>
        <NoOffersImage>
            <Image image="CLOUDY" />
        </NoOffersImage>
        <NoOffersHeader>
            <Translation id="TR_COINMARKET_NO_OFFERS_HEADER" />
        </NoOffersHeader>
        <NoOffersMessage>
            <Translation
                id={
                    hasLoadingFailed
                        ? 'TR_COINMARKET_NO_OFFERS_LOADING_FAILED_MESSAGE'
                        : 'TR_COINMARKET_NO_OFFERS_MESSAGE'
                }
            />
        </NoOffersMessage>
        {hasLoadingFailed && (
            <CoinmarketRefreshTimeWrapper>
                <CoinmarketRefreshTime
                    isLoading={coinmarketRefreshTimeIsLoading}
                    refetchInterval={InvityAPIReloadQuotesAfterSeconds}
                    seconds={coinmarketRefreshTimeSeconds}
                    label={<Translation id="TR_COINMARKET_NO_OFFERS_AUTORELOADING_IN" />}
                />
            </CoinmarketRefreshTimeWrapper>
        )}
        <ButtonsWrapper>
            <Button
                variant={hasLoadingFailed ? 'secondary' : 'primary'}
                onClick={onBackButtonClick}
            >
                <Translation id="TR_COINMARKET_NO_OFFERS_BACK_BUTTON" />
            </Button>
            {hasLoadingFailed && (
                <Button
                    isDisabled={coinmarketRefreshTimeIsLoading}
                    onClick={onReloadOffersButtonClick}
                >
                    <Translation id="TR_COINMARKET_NO_OFFERS_RELOAD_PAGE_BUTTON" />
                </Button>
            )}
        </ButtonsWrapper>
    </NoOffersWrapper>
);
