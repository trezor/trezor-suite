import { useState } from 'react';
import { useSelector } from 'react-redux';

import { suiteSettingsActions } from '@suite/settings';
import {
    DEFAULT_CONTACTS_RELAY_URLS,
    getContactsRelayUrls,
    isValidContactsRelayUrl,
} from '@suite-common/contacts';
import { Input } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { SectionItem } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';

import { selectContactsRelayUrls } from '../contactsSelectors';

const splitRelayUrls = (text: string) => text.split(/[\s,]+/).filter(url => url !== '');

const joinRelayUrls = (urls: readonly string[]) => urls.join(', ');

export const ContactsRelaysSetting = () => {
    const relayUrls = useSelector(selectContactsRelayUrls);
    const [text, setText] = useState(() => joinRelayUrls(relayUrls));
    const { dispatch } = useServices(injectDispatch);

    const typedUrls = splitRelayUrls(text);
    const invalidUrl = typedUrls.find(url => !isValidContactsRelayUrl(url));
    const isSaved = joinRelayUrls(getContactsRelayUrls(typedUrls)) === joinRelayUrls(relayUrls);

    const save = () => {
        const urls = getContactsRelayUrls(typedUrls);

        dispatch(suiteSettingsActions.setDebugMode({ contactsRelayUrls: urls }));
        setText(joinRelayUrls(urls));
    };

    const reset = () => {
        dispatch(suiteSettingsActions.setDebugMode({ contactsRelayUrls: undefined }));
        setText(joinRelayUrls(DEFAULT_CONTACTS_RELAY_URLS));
    };

    return (
        <SectionItem
            title="Contacts relays"
            description="Up to 3 nostr relays for address requests, separated by commas: wss://, or ws:// on this computer. Suite desktop reaches only the default relays and this computer."
            actions={
                <>
                    <Input
                        value={text}
                        onChange={event => setText(event.target.value)}
                        hasError={invalidUrl !== undefined}
                        bottomText={
                            invalidUrl !== undefined ? `Not a relay URL: ${invalidUrl}` : undefined
                        }
                        data-testid="@settings/debug/contacts/relays"
                    />
                    <SectionItem.Button
                        size="small"
                        onClick={save}
                        isDisabled={invalidUrl !== undefined || typedUrls.length === 0 || isSaved}
                    >
                        Save
                    </SectionItem.Button>
                    <SectionItem.Button size="small" priority="secondary" onClick={reset}>
                        Default
                    </SectionItem.Button>
                </>
            }
        />
    );
};
