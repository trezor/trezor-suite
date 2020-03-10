import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';

import { Button, P, H2 } from '@trezor/components';
import * as routerActions from '@suite-actions/routerActions';
import { Dispatch, InjectedModalApplicationProps } from '@suite-types';
import { Translation, Image } from '@suite-components';
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

const StyledImg = styled(props => <Image {...props} />)`
    margin-top: 40px;
    margin-bottom: 15px;
`;

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps> & InjectedModalApplicationProps;

const Index = (props: Props) => {
    return (
        <Wrapper data-test="@welcome">
            <H2>
                <Translation {...messages.TR_WELCOME_MODAL_HEADING} />
            </H2>
            <P size="tiny">
                <Translation {...messages.TR_WELCOME_MODAL_TEXT} />
            </P>
            <StyledImg image="WELCOME" />

            <Button
                data-test="@welcome/continue-button"
                onClick={() => props.goto('suite-analytics')}
            >
                <Translation {...messages.TR_BEGIN} />
            </Button>
        </Wrapper>
    );
};

export default connect(null, mapDispatchToProps)(Index);
