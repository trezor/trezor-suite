import { Card, variables, H1 } from '@trezor/components';
import styled from 'styled-components';

export const StyledCard = styled(Card)`
    display: flex;
    flex-direction: column;
    margin-top: 16px;
`;

export const Heading = styled.div`
    padding-left: 5px;
`;

export const StyledH1 = styled(H1)`
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 5px;
`;

export const Row = styled.div`
    display: flex;
    width: 100%;

    & + & {
        margin-top: 32px;
    }
`;

export const Column = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    max-width: 100%;
`;

export const TransparentBox = styled.div`
    display: flex;
    flex-direction: column;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    border-radius: 6px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

export const InfoBox = styled(TransparentBox)`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    background: ${props => props.theme.BG_GREY};
    padding: 16px;
    border-radius: 6px;
`;

export const Title = styled.div`
    display: flex;
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    align-items: center;
    margin-bottom: 16px;
`;

export const Actions = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: 100%;
    margin-top: 20px;
`;

export const Text = styled.div`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    margin-bottom: 8px;
    margin-top: 8px;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

export const Content = styled.div`
    display: flex;
    margin-top: 32px;
    overflow: hidden;
    padding-left: 10px;
    margin-left: -10px;
    width: 100%;
`;

export const Value = styled.div`
    display: flex;
    margin-top: 10px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.H2};
`;

export const ValueSmall = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.BIG};
    overflow: hidden;
    text-overflow: ellipsis;
`;
