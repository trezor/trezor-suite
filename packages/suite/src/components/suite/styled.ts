import styled from 'styled-components';

export const CircleBorder = styled.div`
    border: 9px solid ${({ theme }) => theme.BG_SECONDARY};
    background: ${({ theme }) => theme.BG_LIGHT_GREEN};
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
`;

export const Divider = styled.div`
    display: flex;
    margin-bottom: 64px;
`;
