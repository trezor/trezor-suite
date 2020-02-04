import React from 'react';
// import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { H2, P } from '@trezor/components-v2';

// import * as backupActions from '@suite/actions/backup/backupActions';
// import * as routerActions from '@suite-actions/routerActions';
import { Dispatch, AppState } from '@suite-types';
import InitBackup from './components/InitBackup';

const Wrapper = styled.div`
    width: 60vw;
    height: 80vh;
    display: flex;
    justify-content: center;
    flex-direction: column;
    /* padding: 60px; */
`;

// const StyledButton = styled(Button)`
//     margin: 5px;
// `;

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    backup: state.backup,
    // devices: state.devices,
    // router: state.router,
});

const mapDispatchToProps = (_dispatch: Dispatch) => ({
    // closeModalApp: bindActionCreators(routerActions.closeModalApp, dispatch),
});

// type Props = ReturnType<typeof mapDispatchToProps> &
//     ReturnType<typeof mapStateToProps> &
//     InjectedModalApplicationProps;

const Backup = () => (
    <Wrapper>
        <H2>Create a backup seed</H2>
        <P>
            Backup seed consisting of predefined number of words is the ultimate key to your crypto
            assets. Trezor will generate the seed for you and it is in your best interrest to write
            it down and store securely.
        </P>

        <InitBackup />
    </Wrapper>
);

export default connect(mapStateToProps, mapDispatchToProps)(Backup);
