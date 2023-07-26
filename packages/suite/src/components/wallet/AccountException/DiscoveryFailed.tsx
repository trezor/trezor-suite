import React from 'react';
import { Translation } from 'src/components/suite';
import { AccountExceptionLayout } from 'src/components/wallet';
import { useDiscovery, useDispatch } from 'src/hooks/suite';
import { restart } from 'src/actions/wallet/discoveryActions';

/**
 * Handler for discovery "hard" error (other than bundle-error)
 * see: @wallet-actions/selectedAccountActions
 */
const DiscoveryFailed = () => {
    const dispatch = useDispatch();
    const { discovery } = useDiscovery();

    const handleClick = () => dispatch(restart());

    return (
        <AccountExceptionLayout
            title={<Translation id="TR_ACCOUNT_EXCEPTION_DISCOVERY_ERROR" />}
            description={discovery && discovery.error ? discovery.error : undefined}
            image="UNI_ERROR"
            actions={[
                {
                    key: '1',
                    icon: 'REFRESH',
                    onClick: handleClick,
                    children: <Translation id="TR_RETRY" />,
                },
            ]}
        />
    );
};

export default DiscoveryFailed;
