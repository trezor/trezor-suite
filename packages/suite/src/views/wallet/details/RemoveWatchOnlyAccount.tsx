import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { type Account } from '@suite-common/wallet-types';
import { Button } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { removeWatchOnlyAccountThunk } from '#src/actions/wallet/watchOnlyAccountThunks';

type RemoveWatchOnlyAccountProps = {
    account: Account;
};

export const RemoveWatchOnlyAccount = ({ account }: RemoveWatchOnlyAccountProps) => {
    const { dispatch } = useServices(injectDispatch);

    const handleRemove = async () => {
        // Leave the account's page first so it never renders a missing account.
        await dispatch(gotoThunk({ routeName: 'suite-index' }));
        dispatch(removeWatchOnlyAccountThunk({ account }));
    };

    return (
        <Button
            intent="critical"
            priority="secondary"
            onClick={handleRemove}
            minWidth={140}
            data-testid="@wallets/details/remove-watch-only-account"
        >
            <Translation id="TR_REMOVE_WATCH_ONLY_ACCOUNT_BUTTON" />
        </Button>
    );
};
