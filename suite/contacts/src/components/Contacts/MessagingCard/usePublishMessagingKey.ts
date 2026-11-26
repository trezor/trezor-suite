import { useState } from 'react';

import { type ContactsError, publishContactsHotKeyThunk } from '@suite-common/contacts';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

export const usePublishMessagingKey = () => {
    const [isPublishing, setIsPublishing] = useState(false);
    const [error, setError] = useState<ContactsError>();
    const { dispatch } = useServices(injectDispatch);

    const publish = async () => {
        setIsPublishing(true);
        setError(undefined);

        const result = await dispatch(publishContactsHotKeyThunk()).unwrap();

        setIsPublishing(false);
        setError(result.success ? undefined : result.error);
    };

    return { isPublishing, error, publish };
};
