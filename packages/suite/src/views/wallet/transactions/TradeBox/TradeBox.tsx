import styled from 'styled-components';
import { differenceInMinutes } from 'date-fns';
import { FormattedRelativeTime } from 'react-intl';

import { getMainnets } from '@suite-common/wallet-config';
import { selectCoinsLegacy } from '@suite-common/wallet-core';
import { spacingsPx, typography } from '@trezor/theme';
import { useSelector } from 'src/hooks/suite';
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
    margin-bottom: ${spacingsPx.lg};

    ${variables.SCREEN_QUERY.BELOW_TABLET} {
        flex-direction: column;
        align-items: normal;
    }
`;

const Title = styled.div`
    ${typography.titleSmall}
    margin-bottom: 10px;
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
    flex-direction: column;
    gap: ${spacingsPx.xxxs};
`;

const Coin = styled.div`
    display: flex;
    align-items: center;
`;

const CoinName = styled.div`
    ${typography.highlight}
    margin-left: 6px;
`;

const CoinSymbol = styled.div`
    ${typography.hint}
    color: ${({ theme }) => theme.textSubdued};
    margin-left: 8px;
`;

const UpdatedAt = styled.div`
    ${typography.hint}
    color: ${({ theme }) => theme.textSubdued};
`;

interface TradeBoxProps {
    account: Account;
}

export const TradeBox = ({ account }: TradeBoxProps) => {
    const network = getMainnets().find(n => n.symbol === account.symbol);
    const coins = useSelector(selectCoinsLegacy);
    const fiatRates = coins.find(item => item.symbol === network?.symbol);

    if (!network) {
        return null;
    }

    const currentRateTimestamp = fiatRates?.current?.ts;
    const getRateAge = (timestamp: number) => differenceInMinutes(new Date(timestamp), new Date());

    return (
        <>
            <Title>
                <Translation id="TR_NAV_TRADE" />
            </Title>

            <StyledCard>
                <Left>
                    <CoinWrapper>
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
                    </CoinWrapper>

                    <TradeBoxPrices account={account} />
                </Left>

                <Right>
                    <TradeBoxMenu account={account} />
                </Right>
            </StyledCard>
        </>
    );
};
