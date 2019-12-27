import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import * as firmwareActions from '@suite-actions/firmwareActions';

import { AppState, Dispatch } from '@suite-types';
import { Button, H1, H2, P } from '@trezor/components-v2';

const mapStateToProps = (state: AppState) => ({
    firmware: state.firmware,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    // confirmSeed: bindActionCreators(firmwareActions.confirmSeed, dispatch),
});

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const SeedConfirmScreen = (props: Props) => {
    const { firmware } = props;

    return (
        <>
            <P>Security checkpoint</P>
            <P>Before you proceed, please make sure you have your recovery seed by hand.</P>
            {/* <Button onClick={props.confirmSeed}>I have my seed with me</Button> */}
            {/* <Link>I don't have my seed and will updated later</Link> */}
        </>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(SeedConfirmScreen);
