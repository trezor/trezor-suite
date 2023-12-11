import { Icon, useTheme } from '@trezor/components';
import { FiatValue, Translation } from 'src/components/suite';
import { AccentP, CardBottomContent, GreyP, StyledCard } from './styled';
import { useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { mapTestnetSymbol } from 'src/utils/wallet/coinmarket/coinmarketUtils';

export const PayoutCard = () => {
    const theme = useTheme();
    // TODO: Replace with real data
    const daysToPayout = 6;
    const payout = '0.001';

    const { symbol } = useSelector(selectSelectedAccount) ?? {};
    const mappedSymbol = symbol ? mapTestnetSymbol(symbol) : '';

    return (
        <StyledCard>
            <Icon icon="CALENDAR_THIN" color={theme.TYPE_LIGHT_GREY} />

            <CardBottomContent>
                <AccentP>
                    <Translation id="TR_STAKE_DAYS_TO" values={{ days: daysToPayout }} />
                </AccentP>
                <GreyP>
                    <Translation
                        id="TR_STAKE_NEXT_PAYOUYT"
                        values={{ fiatAmount: <FiatValue symbol={mappedSymbol} amount={payout} /> }}
                    />
                </GreyP>
            </CardBottomContent>
        </StyledCard>
    );
};
