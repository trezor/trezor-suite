import { variables } from '@trezor/components';
import { FONT_SIZE, FONT_WEIGHT } from '@trezor/components/src/config/variables';
import { PropsWithChildren, ReactNode } from 'react';
import { PriceTicker, Translation, TrendTicker } from 'src/components/suite';
import { Account } from 'src/types/wallet';
import styled from 'styled-components';

const Wrapper = styled.div`
    display: flex;
    gap: 42px;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        gap: 28px;
    }
`;

const Name = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${FONT_SIZE.TINY};
    margin-bottom: 3px;
`;

const Value = styled.div`
    font-weight: ${FONT_WEIGHT.MEDIUM};
`;

interface TradeBoxHeadCardProps extends PropsWithChildren {
    name: ReactNode;
}

const TradeBoxHeadCard = ({ name, children }: TradeBoxHeadCardProps) => (
    <div>
        <Name>{name}</Name>
        <Value>{children}</Value>
    </div>
);

interface TradeBoxPricesProps {
    account: Account;
}

export const TradeBoxPrices = ({ account }: TradeBoxPricesProps) => (
    <Wrapper>
        <TradeBoxHeadCard name={<Translation id="TR_EXCHANGE_RATE" />}>
            <PriceTicker symbol={account.symbol} />
        </TradeBoxHeadCard>

        <TradeBoxHeadCard name={<Translation id="TR_7D_CHANGE" />}>
            <TrendTicker symbol={account.symbol} />
        </TradeBoxHeadCard>
    </Wrapper>
);
