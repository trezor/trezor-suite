import { useState } from 'react';

import { type TranslationKey } from '@suite/intl';
import {
    MAX_CONTACTS_RELAY_URLS,
    isSameContactsRelayUrl,
    isValidContactsRelayUrl,
    selectContactsRelayUrls,
    suiteSettingsActions,
} from '@suite/settings';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { getEffectiveRelayUrls } from 'src/services/nostr';

type GetRelayDraftErrorParams = {
    relayUrl: string;
    relayUrls: readonly string[];
};

const getRelayDraftError = ({
    relayUrl,
    relayUrls,
}: GetRelayDraftErrorParams): TranslationKey | undefined => {
    if (relayUrl === '') return undefined;

    // The settings reducer drops an invalid URL, another spelling of a listed relay and a relay
    // over the limit without telling anyone, so the editor must.
    if (!isValidContactsRelayUrl(relayUrl)) return 'TR_CONTACTS_RELAYS_INVALID';

    if (relayUrls.some(url => isSameContactsRelayUrl(url, relayUrl))) {
        return 'TR_CONTACTS_RELAYS_DUPLICATE';
    }

    if (relayUrls.length >= MAX_CONTACTS_RELAY_URLS) return 'TR_CONTACTS_RELAYS_LIMIT';

    return undefined;
};

/**
 * Add and remove state of the contacts relay list, shared by the settings editor and the relay
 * modal of the contacts page. It edits the effective list, so a configured list never silently
 * drops relays that are in use. Removing the last relay is allowed: an empty list is how the user
 * stops the exchange.
 */
export const useContactsRelayEditor = () => {
    const relayUrls = useSelector(state => getEffectiveRelayUrls(selectContactsRelayUrls(state)));
    const [draft, setDraft] = useState('');
    const dispatch = useDispatch();

    const trimmedDraft = draft.trim();
    const draftErrorId = getRelayDraftError({ relayUrl: trimmedDraft, relayUrls });
    const canAddRelay = trimmedDraft !== '' && draftErrorId === undefined;

    const setRelayUrls = (nextRelayUrls: string[]) => {
        dispatch(suiteSettingsActions.setContactsRelayUrls(nextRelayUrls));
    };

    const addRelay = () => {
        if (!canAddRelay) return;

        setRelayUrls([...relayUrls, trimmedDraft]);
        setDraft('');
    };

    const removeRelay = (relayUrl: string) => {
        setRelayUrls(relayUrls.filter(url => url !== relayUrl));
    };

    return { relayUrls, draft, setDraft, draftErrorId, canAddRelay, addRelay, removeRelay };
};
