import { restartDiscoveryThunk } from '@suite-common/wallet-core';

import { Translation } from 'src/components/suite';
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

    const handleClick = () => dispatch(restartDiscoveryThunk());

    return (
        <AccountExceptionLayout
            title={<Translation id="TR_ACCOUNT_EXCEPTION_DISCOVERY_ERROR" />}
            description={description}
            iconName="warning"
            iconVariant="warning"
            actions={[
                {
                    key: '1',
                    icon: 'repeat',
                    onClick: handleClick,
                    children: <Translation id="TR_RETRY" />,
                },
            ]}
        />
    );
};
