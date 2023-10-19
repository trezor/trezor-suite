import { ReactNode } from 'react';
import styled from 'styled-components';
import { THEME, Icon } from '@trezor/components';

interface BatchWrapperProps {
    children: ReactNode;
    onRemove: () => void;
}

const Wrapper = styled.div`
    display: flex;
    flex-direction: row;
    border-bottom: 1px solid ${THEME.light.STROKE_GREY};
    margin: 16px;
`;

const Fields = styled.div`
    flex: 1;
`;

export const BatchWrapper = ({ children, onRemove }: BatchWrapperProps) => (
    <Wrapper>
        <Fields>{children}</Fields>
        <Icon icon="CROSS" onClick={() => onRemove()} />
    </Wrapper>
);
