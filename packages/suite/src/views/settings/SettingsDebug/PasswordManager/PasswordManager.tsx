import React, { useState } from 'react';
import styled from 'styled-components';
import { Button } from '@trezor/components';

import { SectionItem, TextColumn, ActionColumn } from 'src/components/suite';
import { useDevice, usePasswords } from 'src/hooks/suite';
import { getNextId } from 'src/utils/suite/passwords';

import { EntryForm } from './EntryForm';
import { PasswordsList } from './PasswordsList';
import { TagsList } from './TagsList';

const PasswordManagerBody = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

export const PasswordManager = () => {
    const {
        entries,
        tags,
        entriesByTag,
        isSomeTagSelected,
        config,
        fileName,
        selectedTags,
        setSelectedTags,
        connect,
        disconnect,
        selectedProvider,
        providerConnecting,
        savePasswords,
        device,
    } = usePasswords();

    const { isLocked } = useDevice();
    const isDeviceLocked = isLocked();

    const [formActive, setFormActive] = useState<null | number>(null);

    if (!device?.state) {
        return <SectionItem>Connect and authorized device</SectionItem>;
    }
    if (providerConnecting) {
        return <SectionItem>Connecting...</SectionItem>;
    }

    if (!selectedProvider || !fileName) {
        return (
            <SectionItem>
                <TextColumn
                    title="Trezor password manager"
                    description="Re-implementation of former Trezor Password Manager webextension"
                />
                <ActionColumn>
                    <Button onClick={connect} isDisabled={isDeviceLocked}>
                        Connect to Dropbox
                    </Button>
                    {/* TODO: connect to drive */}
                </ActionColumn>
            </SectionItem>
        );
    }

    return (
        <>
            <SectionItem>
                <TextColumn
                    title="Provider details"
                    description={`type: ${selectedProvider.type}, clientId: ${selectedProvider.clientId}, connected user: ${selectedProvider.user}`}
                />
                <ActionColumn>
                    <Button onClick={disconnect}>Disconnect</Button>
                </ActionColumn>
            </SectionItem>

            <SectionItem>
                <>
                    {config && (
                        <>
                            <PasswordManagerBody>
                                <TagsList
                                    tags={tags}
                                    selectedTags={selectedTags}
                                    setSelectedTags={setSelectedTags}
                                />

                                <PasswordsList
                                    isSomeTagSelected={isSomeTagSelected}
                                    formActive={formActive}
                                    entriesByTag={entriesByTag}
                                    entries={entries}
                                    savePasswords={savePasswords}
                                    setFormActive={setFormActive}
                                    fileName={fileName}
                                    nextId={getNextId(entries)}
                                />
                            </PasswordManagerBody>
                        </>
                    )}
                    {!config && (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'center', flex: 1 }}>
                                {formActive !== 0 && (
                                    <>
                                        <div>There are no passwords yet </div>
                                        <Button
                                            size="tiny"
                                            onClick={() => setFormActive(0)}
                                            type="button"
                                            variant="tertiary"
                                            icon="PENCIL"
                                        >
                                            Add the first one!
                                        </Button>
                                    </>
                                )}
                                {formActive === 0 && (
                                    <EntryForm
                                        cancel={() => setFormActive(null)}
                                        onEncrypted={entry => {
                                            savePasswords(getNextId(entries), entry);
                                            setFormActive(null);
                                        }}
                                    />
                                )}
                            </div>
                        </>
                    )}
                </>
            </SectionItem>
        </>
    );
};
