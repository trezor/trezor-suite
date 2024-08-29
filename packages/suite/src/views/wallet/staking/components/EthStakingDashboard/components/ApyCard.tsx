import { useTheme } from 'styled-components';
import { Card, Icon } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { AccentP, CardBottomContent, GreyP } from './styled';

interface ApyCardProps {
    apy: number;
}

export const ApyCard = ({ apy }: ApyCardProps) => {
    const theme = useTheme();

    return (
        <Card paddingType="small">
            <Icon name="percent" color={theme.iconSubdued} />

            <CardBottomContent>
                <AccentP>{`${apy}%`}</AccentP>
                <GreyP>
                    <Translation id="TR_STAKE_APY" />
                </GreyP>
            </CardBottomContent>
        </Card>
    );
};
