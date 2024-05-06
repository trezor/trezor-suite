import styled from 'styled-components';

import { getMainnets } from '@suite-common/wallet-config';
import { spacingsPx, typography } from '@trezor/theme';
import { Account } from 'src/types/wallet';
import { Translation } from 'src/components/suite';
import { Card, CoinLogo, variables } from '@trezor/components';
import { TradeBoxMenu } from './TradeBoxMenu';
import { TradeBoxPrices } from './TradeBoxPrices';

const StyledCard = styled(Card)`
    flex-flow: row wrap;
    align-items: center;
    justify-content: space-between;
    gap: ${spacingsPx.lg};

    ${variables.SCREEN_QUERY.BELOW_TABLET} {
        flex-direction: column;
        align-items: normal;
    }
`;

const Title = styled.div`
    ${typography.titleSmall}
    margin-bottom: ${spacingsPx.md};
`;

const Left = styled.div`
    display: flex;
    gap: ${spacingsPx.lg};

    ${variables.SCREEN_QUERY.MOBILE} {
        flex-direction: column;
        align-items: normal;
    }
`;

const Right = styled.div`
    display: flex;
`;

const CoinWrapper = styled.div`
    display: flex;
    gap: ${spacingsPx.xs};
`;

const Coin = styled.div`
    display: flex;
    flex-direction: column;
`;

const CoinName = styled.div`
    ${typography.highlight}
    margin-left: ${spacingsPx.xxxs};
`;

const CoinSymbol = styled.div`
    ${typography.hint}
    color: ${({ theme }) => theme.textSubdued};
    margin-left: ${spacingsPx.xxxs};
`;

interface TradeBoxProps {
    account: Account;
}

export const TradeBox = ({ account }: TradeBoxProps) => {
    const network = getMainnets().find(n => n.symbol === account.symbol);

    if (!network) return null;

    return (
        <div>
            <Title>
                <Translation id="TR_NAV_TRADE" />
            </Title>
            <StyledCard>
                <Left>
                    <CoinWrapper>
                        <CoinLogo size={24} symbol={network.symbol} />
                        <Coin>
                            <CoinName>{network.name}</CoinName>
                            <CoinSymbol>{network.symbol.toUpperCase()}</CoinSymbol>
                        </Coin>
                    </CoinWrapper>
                    <TradeBoxPrices account={account} />
                </Left>
                <Right>
                    <TradeBoxMenu account={account} />
                </Right>
            </StyledCard>
        </div>
    );
};
