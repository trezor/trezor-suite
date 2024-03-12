import { ReactNode } from 'react';

import styled from 'styled-components';

import { Icon, Card } from '@trezor/components';

interface BatchWrapperProps {
    children: ReactNode;
    onRemove: () => void;
}

const Wrapper = styled(Card)`
    display: flex;
    flex-direction: row;
    margin: 4px 0 8px 32px;
`;

const Fields = styled.div`
    flex: 1;
    margin-right: 8px;
`;

export const BatchWrapper = ({ children, onRemove }: BatchWrapperProps) => (
    <Wrapper paddingType="small">
        <Fields>{children}</Fields>
        <Icon icon="CROSS" onClick={() => onRemove()} />
    </Wrapper>
);
