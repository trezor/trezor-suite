import { suiteSettingsActions } from '@suite/settings';
import { deviceActions, selectDeviceStaticSessionId } from '@suite-common/device';
import { type AnyAction, createMiddleware } from '@suite-common/redux-utils';
import { selectAccounts } from '@suite-common/wallet-core';

import { STORAGE } from 'src/actions/suite/constants';
import {
    ensureContactSyncThunk,
    markSharedAddressesUsedThunk,
} from 'src/actions/suite/contactsThunks';
import {
    contactsActions,
    selectIsContactsFeatureEnabled,
} from 'src/reducers/suite/contactsReducer';

// What the relay pools follow besides the selected wallet: the wallets with a known identity and the
// relay list.
const RELAY_TRIGGERS: Array<(action: AnyAction) => boolean> = [
    contactsActions.identityLoaded.match,
    deviceActions.forgetDevice.match,
    suiteSettingsActions.setContactsRelayUrls.match,
    action => action.type === STORAGE.LOAD,
];

/**
 * Keeps the contacts address exchange running in the background, not only while the Contacts page
 * is open: relays keep what a contact sent while I was offline, and requests are served
 * automatically. The relay pools start and stop with the contacts feature, which leaving debug mode
 * also turns off, and follow the selected wallet, since a passphrase wallet has a pool only while
 * it is selected.
 */
export const contactsRelayMiddleware = createMiddleware((action, { next, dispatch, getState }) => {
    const wasEnabled = selectIsContactsFeatureEnabled(getState());
    const previousSelectedWallet = selectDeviceStaticSessionId(getState());

    next(action);

    const isEnabled = selectIsContactsFeatureEnabled(getState());
    const isSelectedWalletChanged =
        selectDeviceStaticSessionId(getState()) !== previousSelectedWallet;

    // Account updates are ignored while the feature is off. The pools replay the stored requests
    // as soon as they open, so the shared addresses used meanwhile are marked first, or the replay
    // would serve one of them again.
    if (isEnabled && !wasEnabled) {
        selectAccounts(getState()).forEach(account => {
            dispatch(markSharedAddressesUsedThunk({ account }));
        });
    }

    if (
        isEnabled !== wasEnabled ||
        (isEnabled && (isSelectedWalletChanged || RELAY_TRIGGERS.some(match => match(action))))
    ) {
        dispatch(ensureContactSyncThunk());
    }

    return action;
});
