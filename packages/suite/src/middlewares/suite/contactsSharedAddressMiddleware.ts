import { createMiddleware } from '@suite-common/redux-utils';
import { accountsActions } from '@suite-common/wallet-core';

import { markSharedAddressesUsedThunk } from 'src/actions/suite/contactsThunks';
import { selectIsContactsFeatureEnabled } from 'src/reducers/suite/contactsReducer';

/**
 * Notices when an address I shared with a contact is used on-chain, takes it out of their buffer
 * and re-sends the next address I already attested for them. Attesting a new one needs the device,
 * so that stays with the user.
 */
export const contactsSharedAddressMiddleware = createMiddleware(
    (action, { next, dispatch, getState }) => {
        next(action);

        if (
            accountsActions.updateAccount.match(action) &&
            selectIsContactsFeatureEnabled(getState())
        ) {
            dispatch(markSharedAddressesUsedThunk({ account: action.payload }));
        }

        return action;
    },
);
