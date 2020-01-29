import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';

import { Button, P, H2 } from '@trezor/components-v2';
import { resolveStaticPath } from '@suite-utils/nextjs';
import * as routerActions from '@suite-actions/routerActions';
import { Dispatch, InjectedModalApplicationProps } from '@suite-types';
import { Translation } from '@suite-components';
import messages from '@suite/support/messages';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0 auto;
    padding: 90px;
    justify-content: center;
    width: 780px;
    height: 680px;
`;

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps> & InjectedModalApplicationProps;

const Index = (props: Props) => {
    return (
        <Wrapper>
            <H2 data-test="welcome-message">
                <Translation>{messages.TR_WELCOME_TO_TREZOR}</Translation>
            </H2>
            <P size="tiny">
                <Translation>{messages.TR_WELCOME_TO_TREZOR_TEXT}</Translation>
            </P>
            <img alt="" src={resolveStaticPath('images/welcome/welcome.svg')} />

            <Button data-test="@button/continue" onClick={() => props.goto('suite-analytics')}>
                <Translation>{messages.TR_BEGIN}</Translation>
            </Button>
        </Wrapper>
    );
};

export default connect(null, mapDispatchToProps)(Index);
