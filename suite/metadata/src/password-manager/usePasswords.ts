import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/device';
import { type PasswordEntry } from '@suite-common/metadata-types';
import { useDispatch } from '@suite-common/redux-utils';
import { typedObjectEntries } from '@trezor/utils';

import * as metadataPasswordsActions from '../metadataPasswordsActions';
import * as metadataProviderActions from '../metadataProviderThunks';
import {
    type MetadataRootState,
    selectPasswordManagerState,
    selectSelectedProviderForPasswords,
} from '../metadataReducer';

export const usePasswords = () => {
    const dispatch = useDispatch();

    const [providerConnecting, setProviderConnecting] = useState(false);

    const [selectedTags, setSelectedTags] = useState<Record<string, boolean>>({});

    const device = useSelector(selectSelectedDevice);
    const selectedProvider = useSelector(selectSelectedProviderForPasswords);

    const { fileName, aesKey } = device?.passwords?.[1] || {};

    const { entries, tags, config } = useSelector((state: MetadataRootState) =>
        selectPasswordManagerState(state, fileName),
    );

    const connect = () => {
        setProviderConnecting(true);
        dispatch(metadataPasswordsActions.initThunk()).finally(() => {
            setProviderConnecting(false);
        });
    };

    const disconnect = useCallback(() => {
        console.log('disconnect, selectedProvider', selectedProvider);
        if (!selectedProvider) return;

        dispatch(
            metadataProviderActions.disconnectProviderThunk({
                clientId: selectedProvider.clientId,
                dataType: 'passwords',
                removeMetadata: false,
            }),
        );
    }, [dispatch, selectedProvider]);

    const savePasswords = (nextId: number, passwordEntry: PasswordEntry) => {
        if (!fileName || !aesKey) return;
        dispatch(
            metadataPasswordsActions.addPasswordMetadataThunk(
                nextId,
                passwordEntry,
                fileName,
                aesKey,
            ),
        );
    };

    const removePassword = useCallback(
        (index: number) => {
            if (!fileName || !aesKey) return;

            return dispatch(
                metadataPasswordsActions.removePasswordMetadataThunk(index, fileName, aesKey),
            );
        },
        [fileName, aesKey, dispatch],
    );

    const entriesByTag = typedObjectEntries(entries).reduce(
        (prev: Record<string, PasswordEntry>, [id, entry]) => {
            if (entry.tags.some(tag => selectedTags[tag])) {
                prev[id] = entry;
            }

            return prev;
        },
        {},
    );

    const isSomeTagSelected = Object.values(selectedTags).some(v => v);

    return {
        entries,
        entriesByTag,
        tags,
        isSomeTagSelected,
        config,
        fileName,
        selectedTags,
        setSelectedTags,
        connect,
        disconnect,
        device,
        selectedProvider,
        providerConnecting,
        savePasswords,
        removePassword,
    };
};
