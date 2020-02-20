import React from 'react';
import styled from 'styled-components';
import { Icon, colors, variables } from '@trezor/components-v2';
import { DispatchProps } from '../../Container';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin: 8px 0 16px 0;
`;

const StyledIcon = styled(Icon)`
    cursor: pointer;
`;

const In = styled.div`
    cursor: pointer;
    display: flex;
    align-items: center;
    color: ${colors.BLACK50};
`;

const ClearText = styled.div`
    padding-left: 4px;
    font-size: ${variables.FONT_SIZE.TINY};
    padding-top: 2px;
`;

interface Props {
    sendFormActions: DispatchProps['sendFormActions'];
}

export default ({ sendFormActions }: Props) => (
    <Wrapper>
        <In onClick={() => sendFormActions.clear()}>
            <StyledIcon size={8} color={colors.BLACK50} icon="CROSS" />
            <ClearText>Clear</ClearText>
        </In>
    </Wrapper>
);
