import { Icon, useTheme } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { AccentP, CardBottomContent, GreyP, StyledCard } from './styled';

export const ApyCard = () => {
    const theme = useTheme();
    // TODO: Replace with real data
    const apy = 5;

    return (
        <StyledCard>
            <Icon icon="PERCENT" color={theme.TYPE_LIGHT_GREY} />

            <CardBottomContent>
                <AccentP>{`${apy}%`}</AccentP>
                <GreyP>
                    <Translation id="TR_STAKE_APY" />
                </GreyP>
            </CardBottomContent>
        </StyledCard>
    );
};
