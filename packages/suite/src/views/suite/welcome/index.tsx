import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';

import { Button, P, H2 } from '@trezor/components-v2';
import { resolveStaticPath } from '@suite-utils/nextjs';
import * as routerActions from '@suite-actions/routerActions';
import { Dispatch, InjectedModalApplicationProps } from '@suite-types';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0 auto;
    padding: 36px;
    justify-content: center;
    width: 780px;
    height: 680px;
`;

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps> & InjectedModalApplicationProps;

const Index = (props: Props) => {
    // evaluate: this modal has two steps. should we just simply use local state for that or make
    // another separate "analytics modal" and use goto() to switch views?
    const [showAnalytics, setShowAnalytics] = useState(false);

    if (!showAnalytics) {
        return (
            <Wrapper>
                <H2 data-test="welcome-message">Welcome to Trezor Suite!</H2>
                <P size="tiny">Lorem ipsum...</P>
                <img alt="" src={resolveStaticPath('images/welcome/welcome.svg')} />

                {/* <Button onClick={() => props.goto('onboarding-index')} data-test="@button/go-to-onboarding">
            Let's begin!
        </Button> */}
                <Button onClick={() => setShowAnalytics(true)}>Let's begin!</Button>

                <Button
                    onClick={() => props.closeModalApp()}
                    data-test="@suite/welcome/go-to-suite"
                >
                    I want to use suite now!
                </Button>
            </Wrapper>
        );
    }

    return (
        <Wrapper>
            <H2>Help Trezor Suite get better</H2>
            <P size="tiny">
                Help Trezor Suite become a better product by sending us anonymous analytics data.
                Trezor Suite does NOT track any balance-related or personal data.
            </P>

            <img alt="" src={resolveStaticPath('images/welcome/analytics.svg')} />
        </Wrapper>
    );
};

export default connect(null, mapDispatchToProps)(Index);
