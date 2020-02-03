import React from 'react';
import styled from 'styled-components';
import { H2 } from '@trezor/components-v2';
import { AccountWatchOnlyMode } from '@wallet-reducers/selectedAccountReducer';
import AuthConfirm from './AuthConfirm';

const Content = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 520px;
    background: red;
`;

interface Props {
    mode: AccountWatchOnlyMode[] | undefined;
}

export default (props: Props) => {
    if (!props.mode) return null;
    const badges = props.mode.map(m => {
        switch (m) {
            case 'auth-confirm-failed':
                return <AuthConfirm />;
            default:
                return (
                    <Content key={m}>
                        <H2>{m}</H2>
                    </Content>
                );
        }
    });
    return <>{badges}</>;
};
