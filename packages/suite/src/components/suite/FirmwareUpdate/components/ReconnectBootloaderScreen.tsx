import React from 'react';
// import styled from 'styled-components';
import { connect } from 'react-redux';

import { AppState } from '@suite-types';
import { P } from '@trezor/components-v2';
// import { P, Link } from '@trezor/components-v2';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
});

type Props = ReturnType<typeof mapStateToProps>;

const ReconnectBootloaderScreen = (props: Props) => {
    // const { firmware } = props;

    return (
        <>
            <P>Disconnect and connect your Trezor</P>
            <P>
                First, disconnect your Trezor. Then start swiping accross the touchscreen and plug
                it into USB again. This way it will start in bootloader mode and will be ready to
                receive firmware update.
            </P>
            {/* <Link>Skip this update</Link> */}
        </>
    );
};

export default connect(mapStateToProps, null)(ReconnectBootloaderScreen);
