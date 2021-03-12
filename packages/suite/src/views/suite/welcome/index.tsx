import React from 'react';
import styled from 'styled-components';
import { Button, H2, P } from '@trezor/components';
import * as routerActions from '@suite-actions/routerActions';
import { Translation, Image, Modal } from '@suite-components';
import { useActions } from '@suite-hooks';

// TODO: unused right now, consider deleting if we really dont need welcome/analytics/security checks as separate route/view
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

const Index = () => {
    const { goto } = useActions({ goto: routerActions.goto });
    return (
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
                    // onClick={() => goto('suite-analytics')}
                >
                    <Translation id="TR_BEGIN" />
                </Button>
            </Wrapper>
        </Modal>
    );
};

export default Index;
