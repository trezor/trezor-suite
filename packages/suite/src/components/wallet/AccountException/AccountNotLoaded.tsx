import React from 'react';
import * as discoveryActions from 'src/actions/wallet/discoveryActions';
import { useDevice, useActions } from 'src/hooks/suite';
import { Translation } from 'src/components/suite';
import { AccountExceptionLayout } from 'src/components/wallet';

/**
 * Handler for 'bundle-exception' in discovery
 * Account couldn't be loaded for multiple reasons:
 * - Discovery throws bundle-exception with code or runtime error
 * - Other @trezor/connect runtime error
 */
const AccountNotLoaded = () => {
    const { isLocked } = useDevice();
    const { restart } = useActions({
        restart: discoveryActions.restart,
    });

    return (
        <AccountExceptionLayout
            title={<Translation id="TR_ACCOUNT_EXCEPTION_DISCOVERY_ERROR" />}
            description={<Translation id="TR_ACCOUNT_EXCEPTION_DISCOVERY_DESCRIPTION" />}
            image="CLOUDY"
            actions={[
                {
                    key: '1',
                    icon: 'REFRESH',
                    isLoading: isLocked(),
                    onClick: restart,
                    children: <Translation id="TR_RETRY" />,
                },
            ]}
        />
    );
};

export default AccountNotLoaded;
