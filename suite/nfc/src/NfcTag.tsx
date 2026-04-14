import styled from 'styled-components';

const Circle = styled.div<{ $isActive: boolean }>`
    width: 72px;
    height: 72px;
    border-radius: 50%;
    border: 2px solid black;
    background: ${({ $isActive }) => ($isActive ? 'blue' : 'red')};
`;

interface NfcTagProps {
    active?: boolean;
}

export const NfcTag = ({ active = false }: NfcTagProps) => <Circle $isActive={active} />;
