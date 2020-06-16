import React from 'react';
import { Button } from '@trezor/components';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import { useDevice, useActions } from '@suite-hooks';
import { Translation, Image } from '@suite-components';

import Wrapper from './components/Wrapper';

/**
 * Handler for 'bundle-exception' in discovery
 * Account couldn't be loaded for multiple reasons:
 * - Discovery throws bundle-exception with code or runtime error
 * - Other trezor-connect runtime error
 */
const AccountNotLoaded = () => {
    const { isLocked } = useDevice();
    const { restart } = useActions({
        restart: discoveryActions.restart,
    });

    return (
        <Wrapper
            title={<Translation id="TR_ACCOUNT_EXCEPTION_DISCOVERY_ERROR" />}
            description={<Translation id="TR_ACCOUNT_EXCEPTION_DISCOVERY_DESCRIPTION" />}
            image={<Image image="EMPTY_WALLET" />}
        >
            <Button variant="primary" icon="PLUS" isLoading={isLocked()} onClick={restart}>
                <Translation id="TR_RETRY" />
            </Button>
        </Wrapper>
    );
};

export default AccountNotLoaded;
