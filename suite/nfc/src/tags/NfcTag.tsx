import styled from 'styled-components';

import { Image } from '@trezor/components';

const Wrapper = styled.div<{ $isActive: boolean }>`
    opacity: ${({ $isActive }) => ($isActive ? 1 : 0.4)};
`;

type NfcTagProps = {
    isActive?: boolean;
};

export const NfcTag = ({ isActive: active = false }: NfcTagProps) => (
    <Wrapper $isActive={active}>
        <Image image="NFC_TAG" width={72} />
    </Wrapper>
);
