import React from 'react';
import { resolveStaticPath } from '@suite-utils/nextjs';
// import { Translation } from '@suite-components';
// import messages from '@suite/support/messages';
import Wrapper from './components/Wrapper';

/**
 * Handler for discovery "hard" error (other than bundle-error)
 * see: @wallet-actions/selectedAccountActions
 */
const DiscoveryFailed = () => {
    return (
        <Wrapper
            title="TODO: Discovery failed hard"
            image={resolveStaticPath(`images/suite/uni-error.svg`)}
        />
    );
};

export default DiscoveryFailed;
