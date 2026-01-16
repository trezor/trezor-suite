import { Translation } from '@suite/intl';
import { startOrRestartDiscoveryThunk } from '@suite-common/wallet-core';

import { AccountExceptionLayout } from 'src/components/wallet';
import { useDiscovery, useDispatch } from 'src/hooks/suite';

/**
 * Handler for discovery "hard" error (other than bundle-error)
 * see: @wallet-actions/selectedAccountActions
 */
export const DiscoveryFailed = () => {
    const dispatch = useDispatch();
    const { discovery } = useDiscovery();
    const description =
        discovery !== undefined && discovery.status === 'failed' ? discovery.error : undefined;

    const handleClick = () => dispatch(startOrRestartDiscoveryThunk());

    return (
        <AccountExceptionLayout
            title={<Translation id="TR_ACCOUNT_EXCEPTION_DISCOVERY_ERROR" />}
            description={description}
            iconName="warning"
            iconVariant="warning"
            actions={[
                {
                    key: '1',
                    iconLeft: 'repeat',
                    onClick: handleClick,
                    children: <Translation id="TR_RETRY" />,
                },
            ]}
        />
    );
};
