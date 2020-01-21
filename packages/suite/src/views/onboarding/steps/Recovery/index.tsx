import React from 'react';

import RecoveryModelOne from './components/ModelOne';
import RecoveryModelT from './components/ModelT';
import { Props } from './Container';

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

export default RecoveryStep;
