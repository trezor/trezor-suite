import styled from 'styled-components';

import { Card, Icon, variables, colors } from '@trezor/components';
import { SelectBankAccount } from './components/SelectBankAccount';
import { SendTransaction } from './components/SendTransaction';
import { Translation } from 'src/components/suite';
import { CoinmarketSellOfferInfo } from '../../../components/CoinmarketSellOfferInfo';
import { spacingsPx } from '@trezor/theme';
import { useCoinmarketOffersContext } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { CoinmarketTradeSellType } from 'src/types/coinmarket/coinmarket';

const Wrapper = styled.div`
    display: flex;
    margin: ${spacingsPx.lg} 0;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        flex-direction: column;
    }
`;

const StyledCard = styled(Card)`
    flex: 1;
    padding: 0;
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px 25px;
    border-bottom: 1px solid ${({ theme }) => theme.legacy.STROKE_GREY};
`;

interface ActiveProps {
    active: boolean;
}

const Step = styled.div<ActiveProps>`
    font-weight: ${({ active }) =>
        active ? variables.FONT_WEIGHT.DEMI_BOLD : variables.FONT_WEIGHT.MEDIUM};
    color: ${({ active, theme }) =>
        active ? theme.legacy.TYPE_GREEN : theme.legacy.TYPE_LIGHT_GREY};
    display: flex;
    font-size: ${variables.FONT_SIZE.SMALL};
    flex: 1;
    justify-content: center;
`;

const Left = styled.div`
    display: flex;
    flex: 1;
`;

const Right = styled.div`
    display: flex;
    flex: 1;
    justify-content: flex-end;
`;

const Middle = styled.div`
    display: flex;
    min-width: 65px;
    height: 48px;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.legacy.STROKE_GREY};
`;

export const SelectedOffer = () => {
    const { account, selectedQuote, sellInfo, sellStep } =
        useCoinmarketOffersContext<CoinmarketTradeSellType>();
    if (!selectedQuote) return null;

    return (
        <Wrapper>
            <StyledCard>
                <Header>
                    <Left>
                        <Step active={sellStep === 'BANK_ACCOUNT'}>
                            <Translation id="TR_SELL_BANK_ACCOUNT_STEP" />
                        </Step>
                    </Left>
                    <Middle>
                        <Icon name="chevronRight" color={colors.legacy.TYPE_LIGHT_GREY} />
                    </Middle>
                    <Right>
                        <Step active={sellStep === 'SEND_TRANSACTION'}>
                            <Translation id="TR_SELL_CONFIRM_SEND_STEP" />
                        </Step>
                    </Right>
                </Header>
                {sellStep === 'BANK_ACCOUNT' && <SelectBankAccount />}
                {sellStep === 'SEND_TRANSACTION' && <SendTransaction />}
            </StyledCard>
            <CoinmarketSellOfferInfo
                selectedQuote={selectedQuote}
                account={account}
                providers={sellInfo?.providerInfos}
            />
        </Wrapper>
    );
};
