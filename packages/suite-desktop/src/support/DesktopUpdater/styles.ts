import styled from 'styled-components';

export const Row = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

export const LeftCol = styled.div`
    display: flex;
    flex: 1 1 calc(100% - 40px);
`;

export const RightCol = styled.div`
    display: flex;
    margin-left: 40px;
    max-width: 280px;
    flex: 1 1 100%;
`;

export const Divider = styled.div`
    width: 100%;
    height: 1px;
    margin: 30px 0px;
    background: ${props => props.theme.STROKE_GREY};
`;
