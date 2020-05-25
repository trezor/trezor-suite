import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { Button, Modal, H2, P } from '@trezor/components';
import * as routerActions from '@suite-actions/routerActions';
import { Dispatch } from '@suite-types';
import { Translation, Image } from '@suite-components';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
`;

const StyledImg = styled(props => <Image {...props} />)`
    margin-top: 40px;
    margin-bottom: 15px;
`;

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps>;

const Index = (props: Props) => (
    <Modal useFixedHeight data-test="@welcome">
        <Wrapper>
            <H2>
                <Translation id="TR_WELCOME_MODAL_HEADING" />
            </H2>
            <P size="small">
                <Translation id="TR_WELCOME_MODAL_TEXT" />
            </P>
            <StyledImg image="WELCOME" />

            <Button
                data-test="@welcome/continue-button"
                onClick={() => props.goto('suite-analytics')}
            >
                <Translation id="TR_BEGIN" />
            </Button>
        </Wrapper>
    </Modal>
);

export default connect(null, mapDispatchToProps)(Index);
