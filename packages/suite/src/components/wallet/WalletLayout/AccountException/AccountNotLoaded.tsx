import { selectSelectedAccount } from '@suite/account';
import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import {
    blockchainActions,
    selectIsCustomBackendConfigured,
    startOrRestartDiscoveryThunk,
} from '@suite-common/wallet-core';
import { isTrezorConnectBackendType } from '@suite-common/wallet-utils';
import { useServices } from '@trezor/dependency-injection';
import { RepeatIcon, WarningIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

import { AccountExceptionLayout } from 'src/components/wallet';
import { useSelector } from 'src/hooks/suite';

/**
 * Handler for 'bundle-exception' in discovery
 * Account couldn't be loaded for multiple reasons:
 * - Discovery throws bundle-exception with code or runtime error
 * - Other @trezor/connect runtime error
 */
export const AccountNotLoaded = () => {
    const { dispatch } = useServices(injectDispatch);
    const { isLocked } = useDevice();
    const account = useSelector(selectSelectedAccount);
    const hasCustomBackend = useSelector(
        state =>
            !!account &&
            isTrezorConnectBackendType(account.backendType) &&
            selectIsCustomBackendConfigured(state, account.symbol),
    );

    const handleRetryClick = () => dispatch(startOrRestartDiscoveryThunk());

    const handleUseDefaultBackendsClick = () => {
        if (!account) return;

        // the wallet middleware hands the default backend to Connect before discovery asks for it
        dispatch(blockchainActions.setBackend({ symbol: account.symbol, type: 'default' }));
        dispatch(startOrRestartDiscoveryThunk());
    };

    const retryAction = {
        key: 'retry',
        'data-testid': '@accounts/account-not-loaded/retry-button',
        iconLeft: RepeatIcon,
        isLoading: isLocked(),
        onClick: handleRetryClick,
        children: <Translation id="TR_RETRY" />,
    };

    if (hasCustomBackend) {
        return (
            <AccountExceptionLayout
                data-testid="@accounts/account-not-loaded"
                title={<Translation id="TR_CUSTOM_BACKEND_UNREACHABLE" />}
                description={<Translation id="TR_CUSTOM_BACKEND_UNREACHABLE_DESCRIPTION" />}
                icon={WarningIcon}
                iconVariant="warning"
                actions={[
                    {
                        key: 'use-default-backends',
                        'data-testid': '@accounts/account-not-loaded/use-default-backends',
                        intent: 'warning',
                        isDisabled: isLocked(),
                        onClick: handleUseDefaultBackendsClick,
                        children: <Translation id="TR_USE_DEFAULT_BACKENDS" />,
                    },
                    retryAction,
                ]}
            />
        );
    }

    return (
        <AccountExceptionLayout
            data-testid="@accounts/account-not-loaded"
            title={<Translation id="TR_ACCOUNT_EXCEPTION_DISCOVERY_ERROR" />}
            description={<Translation id="TR_ACCOUNT_EXCEPTION_DISCOVERY_DESCRIPTION" />}
            icon={WarningIcon}
            iconVariant="warning"
            actions={[retryAction]}
        />
    );
};
