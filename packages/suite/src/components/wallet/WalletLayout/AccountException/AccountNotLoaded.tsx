import { useDispatch } from 'react-redux';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { startOrRestartDiscoveryThunk } from '@suite-common/wallet-core';
import { RepeatIcon, WarningIcon } from '@trezor/icons';

import { AccountExceptionLayout } from 'src/components/wallet';

/**
 * Handler for 'bundle-exception' in discovery
 * Account couldn't be loaded for multiple reasons:
 * - Discovery throws bundle-exception with code or runtime error
 * - Other @trezor/connect runtime error
 */
export const AccountNotLoaded = () => {
    const dispatch = useDispatch();
    const { isLocked } = useDevice();

    const handleClick = () => dispatch(startOrRestartDiscoveryThunk());

    return (
        <AccountExceptionLayout
            data-testid="@accounts/account-not-loaded"
            title={<Translation id="TR_ACCOUNT_EXCEPTION_DISCOVERY_ERROR" />}
            description={<Translation id="TR_ACCOUNT_EXCEPTION_DISCOVERY_DESCRIPTION" />}
            icon={WarningIcon}
            iconVariant="warning"
            actions={[
                {
                    key: '1',
                    'data-testid': '@accounts/account-not-loaded/retry-button',
                    iconLeft: RepeatIcon,
                    isLoading: isLocked(),
                    onClick: handleClick,
                    children: <Translation id="TR_RETRY" />,
                },
            ]}
        />
    );
};
