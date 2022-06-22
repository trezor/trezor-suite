/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React from 'react';
import styled from 'styled-components';
import { THEME, Icon } from '@trezor/components';

interface Props {
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

const BatchWrapper: React.FC<Props> = props => (
    <Wrapper>
        <Fields>{props.children}</Fields>
        <Icon icon="CROSS" onClick={() => props.onRemove()} />
    </Wrapper>
);

export default BatchWrapper;
