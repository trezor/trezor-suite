import React from 'react';
import styled from 'styled-components';
import { Icon, colors as oldColors } from '@trezor/components';

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
`;

const ClearText = styled.div`
    padding-left: 5px;
    padding-top: 2px;
`;

interface Props {
    sendFormActions: DispatchProps['sendFormActions'];
}

const Clear = (props: Props) => (
    <Wrapper>
        <In onClick={() => props.sendFormActions.clear()}>
            <StyledIcon size={10} color={oldColors.TEXT_SECONDARY} icon="CLOSE" />
            <ClearText>Clear</ClearText>
        </In>
    </Wrapper>
);

export default Clear;
