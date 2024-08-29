import styled, { useTheme } from 'styled-components';
import { Icon } from '@trezor/components';

const IndicatorWrapper = styled.div`
    width: 25px;
    height: 13px;
    display: flex;
    padding-right: 6px;
    justify-content: center;
    align-items: center;
`;

const Dot = styled.div<{ $color: string }>`
    width: 9px;
    height: 9px;
    border-radius: 100%;
    background: ${props => props.$color};
`;

export interface TransactionReviewStepIndicatorProps {
    state?: 'success' | 'active';
    size?: number;
}

export const TransactionReviewStepIndicator = ({
    state,
    size = 24,
}: TransactionReviewStepIndicatorProps) => {
    const theme = useTheme();

    return (
        <IndicatorWrapper>
            {!state && <Dot $color={theme.legacy.STROKE_GREY} />}
            {state === 'success' && <Icon color={theme.legacy.BG_GREEN} name="check" size={size} />}
            {state === 'active' && <Dot $color={theme.legacy.TYPE_ORANGE} />}
        </IndicatorWrapper>
    );
};
