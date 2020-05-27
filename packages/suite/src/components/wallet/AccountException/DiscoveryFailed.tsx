import React from 'react';
import { Button } from '@trezor/components';
import { Image, Translation } from '@suite-components';
import { useDiscovery, useActions } from '@suite-hooks';
import Wrapper from './components/Wrapper';
import * as discoveryActions from '@wallet-actions/discoveryActions';

/**
 * Handler for discovery "hard" error (other than bundle-error)
 * see: @wallet-actions/selectedAccountActions
 */
const DiscoveryFailed = () => {
    const { discovery } = useDiscovery();
    const { restart } = useActions({
        restart: discoveryActions.restart,
    });

    return (
        <Wrapper
            title={<Translation id="TR_ACCOUNT_EXCEPTION_DISCOVERY_ERROR" />}
            description={discovery && discovery.error ? discovery.error : undefined}
            image={<Image image="UNI_ERROR" />}
        >
            <Button variant="primary" icon="PLUS" onClick={restart}>
                <Translation id="TR_RETRY" />
            </Button>
        </Wrapper>
    );
};

export default DiscoveryFailed;
