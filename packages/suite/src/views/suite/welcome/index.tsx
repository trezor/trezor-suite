import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import * as routerActions from '@suite-actions/routerActions';
import { P } from '@trezor/components';
import { Button } from '@trezor/components-v2';
import { Dispatch, InjectedModalApplicationProps } from '@suite-types';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0 auto;
    padding: 36px;
    justify-content: center;
`;

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps> & InjectedModalApplicationProps;

const Index = (props: Props) => (
    <Wrapper>
        <P data-test="welcome-message">Welcome to Trezor Suite!</P>
        <P>Lorem ipsum...</P>
        <Button onClick={() => props.goto('onboarding-index')}>Let's begin!</Button>
        <Button onClick={() => props.closeModalApp()}>I want to use suite now!</Button>
    </Wrapper>
);

export default connect(null, mapDispatchToProps)(Index);
