import styled from 'styled-components';

import { Account } from 'src/types/wallet';
import { Translation } from 'src/components/suite';
import { CoinLogo, H3, variables } from '@trezor/components';
import { FONT_SIZE, FONT_WEIGHT } from '@trezor/components/src/config/variables';
import { TradeBoxMenu } from './TradeBoxMenu';
import { TradeBoxPrices } from './TradeBoxPrices';
import { getMainnets } from '@suite-common/wallet-config';
import { useSelector } from 'src/hooks/suite';
import { differenceInMinutes } from 'date-fns';
import { FormattedRelativeTime } from 'react-intl';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    padding-top: 6px;
`;

const ContentWrapper = styled.div`
    border-radius: 12px;
    background: ${({ theme }) => theme.BG_WHITE};
`;

const Title = styled(H3)`
    display: flex;
    align-items: center;
    margin-bottom: 10px;
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;

    ${variables.SCREEN_QUERY.MOBILE} {
        flex-direction: column;
        align-items: normal;
    }
`;

const Left = styled.div`
    padding: 20px 24px;
    padding-right: 0px;

    ${variables.SCREEN_QUERY.MOBILE} {
        padding: 20px 16px;
    }
`;

const Right = styled.div`
    padding: 20px 24px;
    flex-shrink: 0;

    ${variables.SCREEN_QUERY.MOBILE} {
        padding: 14px 16px;
        border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
    }
`;

const Footer = styled.div`
    display: flex;
    border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
    padding: 14px 24px;

    ${variables.SCREEN_QUERY.MOBILE} {
        padding: 14px 16px;
    }
`;

const Coin = styled.div`
    display: flex;
    align-items: center;
`;

const CoinName = styled.div`
    font-size: ${FONT_SIZE.NORMAL};
    font-weight: ${FONT_WEIGHT.DEMI_BOLD};
    margin-left: 6px;
`;

const CoinSymbol = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${FONT_SIZE.TINY};
    margin-left: 8px;
`;

const UpdatedAt = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${FONT_SIZE.TINY};
    margin-top: 4px;
`;

const Divider = styled.div`
    width: 100%;
    height: 1px;
    background: ${({ theme }) => theme.STROKE_GREY};
    margin: 30px 0px;
`;

interface TradeBoxProps {
    account: Account;
}

export const TradeBox = ({ account }: TradeBoxProps) => {
    const network = getMainnets().find(n => n.symbol === account.symbol);
    const rates = useSelector(state =>
        state.wallet.fiat.coins.find(r => r.symbol === network?.symbol),
    );

    if (!network) {
        return null;
    }

    const currentRateTimestamp = rates?.current?.ts;
    const getRateAge = (timestamp: number) => differenceInMinutes(new Date(timestamp), new Date());

    return (
        <Wrapper>
            <Title>
                <Translation id="TR_NAV_TRADE" />
            </Title>
            <ContentWrapper>
                <Header>
                    <Left>
                        <Coin>
                            <CoinLogo size={20} symbol={network.symbol} />
                            <CoinName>{network.name}</CoinName>
                            <CoinSymbol>{network.symbol.toUpperCase()}</CoinSymbol>
                        </Coin>
                        <UpdatedAt>
                            <Translation
                                id="TR_LAST_UPDATE"
                                values={{
                                    value: (
                                        <FormattedRelativeTime
                                            value={getRateAge(currentRateTimestamp ?? 0) * 60}
                                            numeric="auto"
                                            updateIntervalInSeconds={10}
                                        />
                                    ),
                                }}
                            />
                        </UpdatedAt>
                    </Left>
                    <Right>
                        <TradeBoxPrices account={account} />
                    </Right>
                </Header>
                <Footer>
                    <TradeBoxMenu account={account} />
                </Footer>
            </ContentWrapper>
            <Divider />
        </Wrapper>
    );
};
