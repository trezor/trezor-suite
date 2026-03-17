import styled from 'styled-components';

const Circle = styled.div<{ $isActive: boolean }>`
    width: 72px;
    height: 72px;
    border-radius: 50%;
    border: 2px solid black;
    background: ${({ $isActive }) => ($isActive ? 'blue' : 'red')};
`;

interface N4W1TagProps {
    active?: boolean;
}

export const N4W1Tag = ({ active = false }: N4W1TagProps) => <Circle $isActive={active} />;
