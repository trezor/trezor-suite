import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { bindActionCreators } from 'redux';
import { colors } from '@trezor/components';

import * as routerActions from '@suite-actions/routerActions';

import { Dispatch } from '@suite-types';

// const mapStateToProps = (state: AppState) => ({
//     // router: state.router,
//     // suite: state.suite,
//     // devices: state.devices,
// });

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps>;

const Item = styled.div`
    width: 100%;
    height: 40px;
    cursor: pointer;
    color: ${colors.TEXT_PRIMARY};
`;

const SettignsMenu = ({ goto }: Props) => {
    return (
        <>
            <>Settings</>
            <Item onClick={() => goto('settings-index')}>General</Item>
            <Item onClick={() => goto('settings-device')}>Device</Item>
            <Item onClick={() => goto('settings-dashboard')}>Dashboard</Item>
            <Item onClick={() => goto('settings-wallet')}>Wallet</Item>
            <Item onClick={() => goto('settings-coins')}>Coins</Item>
        </>
    );
};

export default connect(null, mapDispatchToProps)(SettignsMenu);
