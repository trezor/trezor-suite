import React from 'react';
import { AppState, InjectedModalApplicationProps } from '@suite-types';
import { connect } from 'react-redux';

import RecoveryModelOne from './components/ModelOne';
import RecoveryModelT from './components/ModelT';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
});

export type Props = {
    device?: AppState['suite']['device'];
    modal: InjectedModalApplicationProps['modal'];
};

const RecoveryStep = (props: Props) => {
    const { device, modal } = props;

    if (!device || !device.features) {
        return null;
    }

    if (device.features.major_version === 1) {
        return <RecoveryModelOne modal={modal} />;
    }
    if (device.features.major_version === 2) {
        return <RecoveryModelT modal={modal} />;
    }

    return null;
};

export default connect(mapStateToProps, null)(RecoveryStep);
