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
import ModalWrapper from '@suite-components/ModalWrapper';

const Wrapper = styled(ModalWrapper)`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 80vh;
    min-width: 60vw;
`;

const StyledImg = styled.img`
    margin-top: 40px;
    margin-bottom: 15px;
`;

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps> & InjectedModalApplicationProps;

const Index = (props: Props) => {
    return (
        <Wrapper>
            <H2 data-test="welcome-message">
                <Translation>{messages.TR_WELCOME_MODAL_HEADING}</Translation>
            </H2>
            <P size="tiny">
                {/* todo: remove, temporarily here, instead of cyka blyat */}
                The one place for all your crypto matters.
                {/* <Translation>{messages.TR_WELCOME_MODAL_TEXT}</Translation> */}
            </P>
            <StyledImg alt="" src={resolveStaticPath('images/welcome/welcome.svg')} />

            <Button
                data-test="@welcome/continue-button"
                onClick={() => props.goto('suite-analytics')}
            >
                <Translation>{messages.TR_BEGIN}</Translation>
            </Button>
        </Wrapper>
    );
};

export default connect(null, mapDispatchToProps)(Index);
