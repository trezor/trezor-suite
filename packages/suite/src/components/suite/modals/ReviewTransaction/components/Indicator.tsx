import styled from 'styled-components';
import { useTheme, Icon } from '@trezor/components';

const IndicatorWrapper = styled.div`
    width: 25px;
    height: 25px;
    display: flex;
    padding-right: 6px;
    justify-content: center;
    align-items: center;
`;

const Dot = styled.div<{ color: string }>`
    width: 9px;
    height: 9px;
    border-radius: 100%;
    background: ${props => props.color};
`;

export interface IndicatorProps {
    state?: 'success' | 'active';
    size?: number;
}

const Indicator = ({ state, size = 24 }: IndicatorProps) => {
    const theme = useTheme();

    return (
        <IndicatorWrapper>
            {!state && <Dot color={theme.STROKE_GREY} />}
            {state === 'success' && <Icon color={theme.BG_GREEN} icon="CHECK" size={size} />}
            {state === 'active' && <Dot color={theme.TYPE_ORANGE} />}
        </IndicatorWrapper>
    );
};

export default Indicator;
