import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import styled from 'styled-components';

import { Button, H1 } from '@trezor/components-v2';

import * as suiteActions from '@suite-actions/suiteActions';
import { Dispatch } from '@suite-types';

const Wrapper = styled.div`
    width: 400px;
    height: 400px;
    display: flex;
    justify-content: center;
    flex-direction: column;
    padding: '100px';
`;

// const mapStateToProps = (state: AppState) => ({
//     device: state.suite.device,
//     devices: state.devices,
//     router: state.router,
// });

const mapDispatchToProps = (dispatch: Dispatch) => ({
    closeModalApp: bindActionCreators(suiteActions.closeModalApp, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps> & {
    modal: React.ReactNode;
    cancelable: boolean;
};
// ReturnType<typeof mapStateToProps>

const Firmware = ({ closeModalApp, modal }: Props) => (
    <Wrapper>
        {modal && modal}
        {!modal && (
            <>
                <H1>Example app modal</H1>
                <Button onClick={() => closeModalApp()} data-test="@modal/firmware/exit-button">
                    Exit
                </Button>
            </>
        )}
    </Wrapper>
);

export default connect(null, mapDispatchToProps)(Firmware);
