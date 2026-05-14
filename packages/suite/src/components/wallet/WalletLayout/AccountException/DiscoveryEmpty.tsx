import { Translation } from '@suite/intl';
import { goto } from '@suite/router';

import { AccountExceptionLayout } from 'src/components/wallet';
import { useDispatch } from 'src/hooks/suite';

/**
 * Handler for invalid wallet setting, no coins in discovery
 * see: @wallet-actions/selectedAccountActions
 */
export const DiscoveryEmpty = () => {
    const dispatch = useDispatch();

    const goToCoinsSettings = () => dispatch(goto({ routeName: 'settings-coins' }));

    return (
        <AccountExceptionLayout
            title={<Translation id="TR_ACCOUNT_EXCEPTION_DISCOVERY_EMPTY" />}
            iconName="cloud"
            iconVariant="info"
            description={<Translation id="TR_ACCOUNT_EXCEPTION_DISCOVERY_EMPTY_DESC" />}
            actions={[
                {
                    key: '1',
                    iconLeft: 'gear',
                    onClick: goToCoinsSettings,
                    children: <Translation id="TR_COIN_SETTINGS" />,
                },
            ]}
        />
    );
};
