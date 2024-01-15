import React from 'react';
import styled from 'styled-components';
import { Button } from '@trezor/components';
import { selectDevice } from '@suite-common/wallet-core';

import { SectionItem, TextColumn, ActionColumn } from 'src/components/suite';
import { useSelector, usePasswords } from 'src/hooks/suite';

import { PasswordEntry as PasswordEntryComponent } from './PasswordEntry';
import { Tag } from './Tag';

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

const PasswordsList = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    flex: 1;
`;

export const PasswordManager = () => {
    const {
        entries,
        entriesByTag,
        tags,
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
    } = usePasswords();
    const device = useSelector(selectDevice);

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
                                <PasswordsList>
                                    {(isSomeTagSelected && !isAllTagSelected
                                        ? Object.entries(entriesByTag)
                                        : Object.entries(entries)
                                    ).map(([key, entry]) => (
                                        <PasswordEntryComponent
                                            {...entry}
                                            devicePath={device!.path}
                                            key={key}
                                        />
                                    ))}
                                    {!Object.entries(entries).length && (
                                        <TextColumn
                                            description={`No passwords found in file ${fileName}`}
                                        />
                                    )}
                                </PasswordsList>
                            </PasswordManagerBody>
                        ) : (
                            <div> no data</div>
                        )}
                    </>
                )}
            </SectionItem>
        </>
    );
};
