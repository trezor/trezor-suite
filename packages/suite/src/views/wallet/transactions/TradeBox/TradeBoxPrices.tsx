import styled from 'styled-components';
import { variables } from '@trezor/components';
import { spacingsPx, typography } from '@trezor/theme';
import { PropsWithChildren, ReactNode } from 'react';
import { PriceTicker, Translation, TrendTicker } from 'src/components/suite';
import { Account } from 'src/types/wallet';

const Wrapper = styled.div`
    display: flex;
    gap: 42px;
    margin-top: 3px;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        gap: 28px;
    }
`;

const CardContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xxxs};
`;

const Name = styled.div`
    color: ${({ theme }) => theme.textSubdued};
    ${typography.hint}
`;

interface TradeBoxHeadCardProps extends PropsWithChildren {
    name: ReactNode;
}

const TradeBoxHeadCard = ({ name, children }: TradeBoxHeadCardProps) => (
    <CardContainer>
        <Name>{name}</Name>
        {children}
    </CardContainer>
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
