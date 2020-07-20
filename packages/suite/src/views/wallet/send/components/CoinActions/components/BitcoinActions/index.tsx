import React from 'react';
import styled from 'styled-components';

import AddRecipient from './components/AddRecipient';
import AddLocktime from './components/AddLocktime';
import RBF from './components/RBF';
import Broadcast from './components/Broadcast';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    justify-content: space-between;
`;

const Left = styled.div`
    display: flex;
    flex: 1;
    justify-content: flex-start;
`;

const Right = styled.div`
    display: flex;
    flex: 1;
    justify-content: flex-end;
`;

export default () => {
    return (
        <Wrapper>
            <Left>
                <AddLocktime />
                <Broadcast />
                <RBF />
            </Left>
            <Right>
                <AddRecipient />
            </Right>
        </Wrapper>
    );
};
