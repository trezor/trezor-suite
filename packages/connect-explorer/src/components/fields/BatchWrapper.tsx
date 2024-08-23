import { ReactNode } from 'react';

import styled from 'styled-components';

import { IconLegacy, Card } from '@trezor/components';

interface BatchWrapperProps {
    children: ReactNode;
    onRemove: () => void;
}

const Wrapper = styled(Card)`
    display: flex;
    flex-direction: row;
    margin: 4px 0 8px;
    padding: 8px;
    gap: 8px;
`;

const Fields = styled.div`
    flex: 1;
`;

export const BatchWrapper = ({ children, onRemove }: BatchWrapperProps) => (
    <Wrapper paddingType="small">
        <IconLegacy icon="CROSS" onClick={() => onRemove()} size={20} />
        <Fields>{children}</Fields>
    </Wrapper>
);
