import React from 'react';

import RecoveryModelOne from './components/ModelOne';
import RecoveryModelT from './components/ModelT';
import { Props } from './Container';

const RecoveryStep = (props: Props) => {
    const { device } = props;

    if (!device || !device.features) {
        return null;
    }

    if (device.features.major_version === 1) {
        return <RecoveryModelOne />;
    }
    if (device.features.major_version === 2) {
        return <RecoveryModelT />;
    }

    return null;
};

export default RecoveryStep;
