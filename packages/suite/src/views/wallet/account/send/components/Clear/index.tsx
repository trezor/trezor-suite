import React from 'react';
import styled from 'styled-components';
import { Icon, colors, variables } from '@trezor/components-v2';
import { DispatchProps } from '../../Container';

const StyledIcon = styled(Icon)`
    cursor: pointer;
`;

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
`;

const In = styled.div`
    margin-right: -15px;
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

const Clear = (props: Props) => (
    <Wrapper>
        <In onClick={() => props.sendFormActions.clear()}>
            <StyledIcon size={8} color={colors.BLACK50} icon="CROSS" />
            <ClearText>Clear</ClearText>
        </In>
    </Wrapper>
);

export default Clear;
