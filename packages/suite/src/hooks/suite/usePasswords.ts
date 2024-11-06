import { useState, useCallback } from 'react';

import { selectDevice } from '@suite-common/wallet-core';

import { useSelector, useDispatch } from 'src/hooks/suite';
import * as metadataProviderActions from 'src/actions/suite/metadataProviderActions';
import * as metadataPasswordsActions from 'src/actions/suite/metadataPasswordsActions';
import type { PasswordEntry } from 'src/types/suite/metadata';
import {
    selectPasswordManagerState,
    selectSelectedProviderForPasswords,
} from 'src/reducers/suite/metadataReducer';

export const usePasswords = () => {
    const dispatch = useDispatch();

    const [providerConnecting, setProviderConnecting] = useState(false);

    const [selectedTags, setSelectedTags] = useState<Record<string, boolean>>({});

    const device = useSelector(selectDevice);
    const selectedProvider = useSelector(selectSelectedProviderForPasswords);

    const { fileName, aesKey } = device?.passwords?.[1] || {};

    const { entries, tags, config } = useSelector(state =>
        selectPasswordManagerState(state, fileName),
    );

    const connect = () => {
        setProviderConnecting(true);
        dispatch(metadataPasswordsActions.init()).finally(() => {
            setProviderConnecting(false);
        });
    };

    const disconnect = useCallback(() => {
        console.log('disconnect, selectedProvider', selectedProvider);
        if (!selectedProvider) return;

        dispatch(
            metadataProviderActions.disconnectProvider({
                clientId: selectedProvider.clientId,
                dataType: 'passwords',
                removeMetadata: false,
            }),
        );
    }, [dispatch, selectedProvider]);

    const savePasswords = (nextId: number, passwordEntry: PasswordEntry) => {
        if (!fileName || !aesKey) return;
        dispatch(
            metadataPasswordsActions.addPasswordMetadata(nextId, passwordEntry, fileName, aesKey),
        );
    };

    const removePassword = useCallback(
        (index: number) => {
            if (!fileName || !aesKey) return;

            return dispatch(
                metadataPasswordsActions.removePasswordMetadata(index, fileName, aesKey),
            );
        },
        [fileName, aesKey, dispatch],
    );

    const entriesByTag = Object.entries(entries).reduce(
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
