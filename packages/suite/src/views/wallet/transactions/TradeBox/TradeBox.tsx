import styled from 'styled-components';

import { spacings, spacingsPx, typography } from '@trezor/theme';
import { Account } from 'src/types/wallet';
import { Translation } from 'src/components/suite';
import { Card, Row, variables } from '@trezor/components';
import { TradeBoxMenu } from './TradeBoxMenu';
import { TradeBoxPrices } from './TradeBoxPrices';
import { getTitleForNetwork } from '@suite-common/wallet-utils';
import { CoinLogo } from '@trezor/product-components';

// eslint-disable-next-line local-rules/no-override-ds-component
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

export const TradeBox = ({ account }: TradeBoxProps) => (
    <div>
        <Title>
            <Translation id="TR_NAV_TRADE" />
        </Title>
        <StyledCard>
            <Left>
                <Row gap={spacings.xs} alignItems="center">
                    <CoinLogo size={24} symbol={account.symbol} />
                    <Coin>
                        <CoinName>
                            <Translation id={getTitleForNetwork(account.symbol)} />
                        </CoinName>
                        <CoinSymbol>{account.symbol.toUpperCase()}</CoinSymbol>
                    </Coin>
                </Row>
                <TradeBoxPrices account={account} />
            </Left>
            <Right>
                <TradeBoxMenu account={account} />
            </Right>
        </StyledCard>
    </div>
);
