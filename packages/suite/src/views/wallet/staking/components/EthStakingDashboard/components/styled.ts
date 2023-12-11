import styled from 'styled-components';
import { Card, P, variables } from '@trezor/components';

export const StyledCard = styled(Card)`
    padding: 12px;
`;

export const CardBottomContent = styled.div`
    margin-top: 18px;
`;

export const AccentP = styled(P)`
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.H2};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

export const GreyP = styled(P)`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

export const InfoBox = styled.div`
    margin: -10px -10px 16px -10px;
    padding: 6px;
    border: 1px solid ${({ theme }) => theme.STROKE_GREY};
    border-radius: 16px;
    position: relative;

    &:after {
        content: '';
        display: block;
        position: absolute;
        bottom: -6px;
        left: 12px;
        background-color: ${({ theme }) => theme.BG_WHITE};
        height: 14px;
        width: 16px;
        clip-path: polygon(100% 50%, 0 50%, 50% 100%);
    }

    &:before {
        content: '';
        display: block;
        position: absolute;
        bottom: -7px;
        left: 12px;
        background-color: ${({ theme }) => theme.STROKE_GREY};
        height: 14px;
        width: 16px;
        clip-path: polygon(100% 50%, 0 50%, 50% 100%);
    }
`;

export const ProgressBar = styled.div<{ $staked?: number; $rewards?: number }>`
    height: 6px;
    width: 100%;
    background: ${({ theme, $staked }) => ($staked ? theme.STROKE_GREY : theme.BG_GREY)};
    border-radius: 6px;
    position: relative;

    &:after {
        content: '';
        display: ${({ $rewards, $staked }) => ($rewards && $staked ? 'block' : 'none')};
        min-width: 1%;
        max-width: 100%;
        width: ${({ $staked = 0, $rewards = 0 }) => ($rewards * 100) / $staked}%;
        background: ${({ theme }) => theme.BG_GREEN};
        border-radius: 6px;
        height: 6px;
        position: absolute;
        right: 0;
        top: 0;
        box-shadow: -2px 0 0 0 ${({ theme }) => theme.BG_WHITE};
    }
`;
