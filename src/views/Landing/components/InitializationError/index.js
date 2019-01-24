/* @flow */

import React from 'react';
import styled from 'styled-components';
import Notification from 'components/Notification';

const Wrapper = styled.div`
    width: 100%;
`;

const InitializationError = (props: { error: string }) => (
    <Wrapper>
        <Notification
            title="Initialization error"
            message={props.error}
            type="error"
            cancelable={false}
        />
    </Wrapper>
);

export default InitializationError;