import React from 'react';
import { Image, Translation } from '@suite-components';

import Wrapper from './components/Wrapper';

/**
 * Handler for discovery "hard" error (other than bundle-error)
 * see: @wallet-actions/selectedAccountActions
 */
const DiscoveryFailed = () => {
    return (
        <Wrapper
            title={<Translation id="TR_ACCOUNT_EXCEPTION_DISCOVERY_ERROR" />}
            image={<Image image="UNI_ERROR" />}
        />
    );
};

export default DiscoveryFailed;
