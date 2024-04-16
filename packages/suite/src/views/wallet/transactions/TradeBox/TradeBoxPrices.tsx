import styled from 'styled-components';
import { variables } from '@trezor/components';
import { spacingsPx, typography } from '@trezor/theme';
import { PropsWithChildren, ReactNode } from 'react';
import { FiatValue, Translation, TrendTicker } from 'src/components/suite';
import { Account } from 'src/types/wallet';
import { NoRatesTooltip } from 'src/components/suite/Ticker/NoRatesTooltip';
import { LastUpdateTooltip } from 'src/components/suite/Ticker/LastUpdateTooltip';

const Wrapper = styled.div`
    display: flex;
    gap: 42px;

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
    ${typography.label}
    margin-bottom: 3px;
`;

const FiatRateWrapper = styled.span`
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

interface TradeBoxHeadCardProps extends PropsWithChildren {
    name: ReactNode;
}

const TradeBoxHeadCard = ({ name, children }: TradeBoxHeadCardProps) => (
    <CardContainer>
        <Name>{name}</Name>
        <div>{children}</div>
    </CardContainer>
);

interface TradeBoxPricesProps {
    account: Account;
}

export const TradeBoxPrices = ({ account }: TradeBoxPricesProps) => (
    <Wrapper>
        <TradeBoxHeadCard name={<Translation id="TR_EXCHANGE_RATE" />}>
            <FiatValue amount="1" symbol={account.symbol} showLoadingSkeleton>
                {({ rate, timestamp }) =>
                    rate && timestamp ? (
                        <LastUpdateTooltip timestamp={timestamp}>
                            <FiatRateWrapper>{rate}</FiatRateWrapper>
                        </LastUpdateTooltip>
                    ) : (
                        <NoRatesTooltip />
                    )
                }
            </FiatValue>
        </TradeBoxHeadCard>

        <TradeBoxHeadCard name={<Translation id="TR_7D_CHANGE" />}>
            <TrendTicker symbol={account.symbol} />
        </TradeBoxHeadCard>
    </Wrapper>
);
