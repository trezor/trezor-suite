import React, { useState } from 'react';

import styled from 'styled-components';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { EntryForm, PasswordsList, TagsList, getNextId, usePasswords } from '@suite/metadata';
import { Button } from '@trezor/components';
import { PencilIcon } from '@trezor/icons';
import { SectionItem } from '@trezor/product-components';

const PasswordManagerBody = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Section = styled.div`
    display: flex;
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
        return <Section>Connect and authorize device</Section>;
    }
    if (providerConnecting) {
        return <Section>Connecting...</Section>;
    }

    if (!selectedProvider || !fileName) {
        return (
            <SectionItem
                title="Trezor password manager"
                description="Re-implementation of former Trezor Password Manager webextension"
                actions={
                    <SectionItem.Button
                        isDisabled={isDeviceLocked}
                        isTooltipActive={isDeviceLocked}
                        tooltipContent={
                            <Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />
                        }
                        onClick={connect}
                    >
                        Connect to Dropbox
                    </SectionItem.Button>
                }
            />
        );
    }

    return (
        <>
            <SectionItem
                title="Provider details"
                description={`type: ${selectedProvider.type}, clientId: ${selectedProvider.clientId}, connected user: ${selectedProvider.user}`}
                actions={<SectionItem.Button onClick={disconnect}>Disconnect</SectionItem.Button>}
            />
            <Section>
                {config ? (
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
                ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', flex: 1 }}>
                        {formActive !== 0 && (
                            <>
                                <div>There are no passwords yet </div>
                                <Button
                                    size="small"
                                    onClick={() => setFormActive(0)}
                                    type="button"
                                    intent="neutral"
                                    priority="secondary"
                                    iconLeft={PencilIcon}
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
                )}
            </Section>
        </>
    );
};
