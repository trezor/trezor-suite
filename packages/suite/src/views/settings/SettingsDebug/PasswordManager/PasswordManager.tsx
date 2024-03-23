import React, { useState } from 'react';
import styled from 'styled-components';
import { Button } from '@trezor/components';

import { SectionItem, TextColumn, ActionColumn } from 'src/components/suite';
import { usePasswords } from 'src/hooks/suite';
import { getNextId } from 'src/utils/suite/passwords';

import { Tag } from './Tag';
import { EntryForm } from './EntryForm';
import { PasswordsList } from './PasswordsList';

const PasswordManagerBody = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const TagsList = styled.div`
    display: flex;
    flex-direction: row;
    margin-bottom: 8px;
    gap: 4px;
`;

export const PasswordManager = () => {
    const {
        entries,
        tags,
        entriesByTag,
        isSomeTagSelected,
        isAllTagSelected,
        extVersion,
        fileName,
        fetchingPasswords,
        selectedTags,
        setSelectedTags,
        connect,
        disconnect,
        selectedProvider,
        providerConnecting,
        savePasswords,
    } = usePasswords();

    const [formActive, setFormActive] = useState<undefined | number>();

    if (providerConnecting) {
        return <SectionItem>Connecting...</SectionItem>;
    }

    if (!selectedProvider || !fileName) {
        return (
            <SectionItem>
                <TextColumn
                    title="Trezor password manager"
                    description="Read only implementation of former Trezor Password Manager"
                />
                <ActionColumn>
                    <Button onClick={connect}>Connect to dropbox</Button>
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
                {fetchingPasswords ? (
                    <div>Fetching passwords...</div>
                ) : (
                    <>
                        {extVersion ? (
                            <PasswordManagerBody>
                                <TagsList>
                                    {Object.entries(tags).map(([key, value]) => (
                                        <Tag
                                            key={key}
                                            title={value.title}
                                            onClick={() => {
                                                setSelectedTags({
                                                    ...selectedTags,
                                                    [key]: !selectedTags[key],
                                                });
                                            }}
                                            isSelected={selectedTags[key]}
                                        />
                                    ))}
                                </TagsList>
                                <PasswordsList
                                    isSomeTagSelected={isSomeTagSelected}
                                    isAllTagSelected={isAllTagSelected}
                                    formActive={formActive}
                                    entriesByTag={entriesByTag}
                                    entries={entries}
                                    savePasswords={savePasswords}
                                    setFormActive={setFormActive}
                                    fileName={fileName}
                                    nextId={getNextId(entries)}
                                />
                            </PasswordManagerBody>
                        ) : (
                            <div style={{ display: 'flex', justifyContent: 'center', flex: 1 }}>
                                {formActive !== 0 && (
                                    <Button
                                        size="tiny"
                                        onClick={() => setFormActive(0)}
                                        type="button"
                                        variant="tertiary"
                                        icon="PENCIL"
                                    >
                                        Add a password
                                    </Button>
                                )}
                                {formActive === 0 && (
                                    <EntryForm
                                        cancel={() => setFormActive(undefined)}
                                        onEncrypted={entry => {
                                            savePasswords(getNextId(entries), entry);
                                            setFormActive(getNextId(entries));
                                        }}
                                    />
                                )}
                            </div>
                        )}
                    </>
                )}
            </SectionItem>
        </>
    );
};
