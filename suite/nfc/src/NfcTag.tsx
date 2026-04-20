import styled from 'styled-components';

import { Image } from '@trezor/components';

const Wrapper = styled.div<{ $isActive: boolean }>`
    opacity: ${({ $isActive }) => ($isActive ? 1 : 0.4)};
`;

interface NfcTagProps {
    active?: boolean;
}

export const NfcTag = ({ active = false }: NfcTagProps) => (
    <Wrapper $isActive={active}>
        <Image image="NFC_TAG" width={72} />
    </Wrapper>
);
