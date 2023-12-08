import { variables, H2, Card } from '@trezor/components';
import { borders } from '@trezor/theme';
import styled from 'styled-components';

export const Heading = styled.div`
    padding-left: 5px;
`;

export const StyledH2 = styled(H2)`
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 5px;
`;

export const Row = styled.div`
    display: flex;
    width: 100%;
    margin-top: 24px;
`;

export const Column = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    max-width: 100%;
`;

export const Title = styled.div`
    display: flex;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    align-items: center;
    margin-bottom: 16px;
`;

export const Actions = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    margin-top: 24px;
    justify-content: center;
`;

export const Text = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    margin-bottom: 8px;
    margin-top: 8px;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

export const Content = styled.div`
    display: flex;
    overflow: hidden;
    padding-left: 10px;
    margin-left: -10px;
    width: 100%;
`;

export const Value = styled.div`
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-variant-numeric: tabular-nums slashed-zero;
    width: fit-content;
    background: ${({ theme }) => theme.BG_LIGHT_GREY};
    border: 1px solid ${({ theme }) => theme.STROKE_GREY};
    border-radius: ${borders.radii.xs};
    word-break: break-all;
    padding: 10px;
`;

export const StyledCard = styled(Card)`
    & + & {
        margin-top: 8px;
    }
`;
