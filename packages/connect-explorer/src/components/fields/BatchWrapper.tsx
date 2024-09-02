import { ReactNode } from 'react';

import styled from 'styled-components';

import { Card, Icon } from '@trezor/components';

interface BatchWrapperProps {
    children: ReactNode;
    onRemove: () => void;
}

// eslint-disable-next-line local-rules/no-override-ds-component
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
        <Icon name="close" onClick={() => onRemove()} size={20} />
        <Fields>{children}</Fields>
    </Wrapper>
);
