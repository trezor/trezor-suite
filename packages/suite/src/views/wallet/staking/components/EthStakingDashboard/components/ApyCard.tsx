import { Icon, useTheme } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { AccentP, CardBottomContent, GreyP, StyledCard } from './styled';

interface ApyCardProps {
    apy: string;
}

export const ApyCard = ({ apy }: ApyCardProps) => {
    const theme = useTheme();

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
