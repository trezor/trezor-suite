import styled from 'styled-components';

export const IconBorderedWrapper = styled.div`
    border: 9px solid ${({ theme }) => theme.backgroundPrimarySubtleOnElevation0};
    background: ${({ theme }) => theme.backgroundPrimarySubtleOnElevation1};
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
