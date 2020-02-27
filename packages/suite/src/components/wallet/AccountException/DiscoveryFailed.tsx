import React from 'react';
import { UniErrorImg, Translation } from '@suite-components';
import messages from '@suite/support/messages';
import Wrapper from './components/Wrapper';

/**
 * Handler for discovery "hard" error (other than bundle-error)
 * see: @wallet-actions/selectedAccountActions
 */
const DiscoveryFailed = () => {
    return (
        <Wrapper
            title={<Translation {...messages.TR_ACCOUNT_EXCEPTION_DISCOVERY_ERROR} />}
            image={<UniErrorImg />}
        />
    );
};

export default DiscoveryFailed;
