import styled from 'styled-components';
import { Button, variables, Card } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { BuyTrade } from 'invity-api';
import { useCoinmarketBuyOffersContext } from 'src/hooks/wallet/useCoinmarketBuyOffers';
import { spacings, spacingsPx, typography } from '@trezor/theme';
import { CoinmarketUtilsProvider } from '../CoinmarketUtils/CoinmarketUtilsProvider';
import CoinmarketUtilsPrice from '../CoinmarketUtils/CoinmarketUtilsPrice';
import { getTagAndInfoNote } from 'src/utils/wallet/coinmarket/coinmarketUtils';

const OfferWrap = styled(Card)`
    min-height: 100px;
`;

const Offer = styled.div`
    display: flex;
    height: 100px;
`;

const OfferColumn = styled.div`
    display: flex;
    flex-direction: column;
    flex: none;
`;

const OfferColumn1 = styled(OfferColumn)`
    width: 28.75%;
    justify-content: center;
`;

const OfferColumn2 = styled(OfferColumn)`
    width: 100%;
    flex: auto;
    justify-content: center;
`;

const OfferColumn3 = styled(OfferColumn)`
    justify-content: center;
`;

const OfferProvider = styled(CoinmarketUtilsProvider)<{ $isMargined?: boolean }>`
    ${({ $isMargined }) => ($isMargined ? 'margin-top: auto;' : '')}
`;

const OfferBadgeWrap = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
`;

const OfferBadgeInfo = styled.div`
    margin-left: ${spacingsPx.xs};
    ${typography.label};
    color: ${({ theme }) => theme.textSubdued};
`;

const StyledButton = styled(Button)`
    width: 180px;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        width: 100%;
    }
`;

export interface CoinmarketOffersItemProps {
    quote: BuyTrade;
    wantCrypto: boolean;
}

const CoinmarketOffersItem = ({ quote, wantCrypto }: CoinmarketOffersItemProps) => {
    const { selectQuote, providersInfo } = useCoinmarketBuyOffersContext();
    const { exchange } = quote;
    const { tag } = getTagAndInfoNote(quote);
    const tagsExist = !!tag;

    return (
        <OfferWrap margin={{ top: spacings.md }}>
            <Offer>
                <OfferColumn1>
                    <OfferBadgeWrap>
                        {/*<Badge variant="primary">Limited offer</Badge>*/}
                        <OfferBadgeInfo>{/*0% fees on all buys*/}</OfferBadgeInfo>
                    </OfferBadgeWrap>
                    <OfferProvider
                        exchange={exchange}
                        providers={providersInfo}
                        $isMargined={tagsExist}
                    />
                </OfferColumn1>
                <OfferColumn2>
                    <CoinmarketUtilsPrice quote={quote} wantCrypto={wantCrypto} />
                </OfferColumn2>
                <OfferColumn3>
                    {quote.status === 'LOGIN_REQUEST' ? (
                        <StyledButton onClick={() => selectQuote(quote)}>
                            <Translation id="TR_LOGIN_PROCEED" />
                        </StyledButton>
                    ) : (
                        <StyledButton
                            isDisabled={!!quote.error}
                            onClick={() => selectQuote(quote)}
                            data-test="@coinmarket/buy/offers/get-this-deal-button"
                        >
                            <Translation id="TR_BUY_GET_THIS_OFFER" />
                        </StyledButton>
                    )}
                </OfferColumn3>
            </Offer>
        </OfferWrap>
    );
};

export default CoinmarketOffersItem;
