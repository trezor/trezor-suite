import React from 'react';
import { Translation } from '@suite-components';
import { AccountExceptionLayout } from '@wallet-components';
import { useDiscovery, useActions } from '@suite-hooks';
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
        <AccountExceptionLayout
            title={<Translation id="TR_ACCOUNT_EXCEPTION_DISCOVERY_ERROR" />}
            description={discovery && discovery.error ? discovery.error : undefined}
            image="UNIVERSAL_ERROR"
            actions={[
                {
                    key: '1',
                    icon: 'REFRESH',
                    onClick: restart,
                    children: <Translation id="TR_RETRY" />,
                },
            ]}
        />
    );
};

export default DiscoveryFailed;
