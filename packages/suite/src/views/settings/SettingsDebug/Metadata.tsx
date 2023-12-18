import React, { useState, useMemo } from 'react';
import styled from 'styled-components';

import { SectionItem, TextColumn, ActionColumn } from 'src/components/suite';
import { useSelector, useActions } from 'src/hooks/suite';
import { MetadataProvider } from '@suite-common/metadata-types';
import { DropZone } from 'src/components/suite/DropZone';
import { Button, Select } from '@trezor/components';
import * as metadataUtils from 'src/utils/suite/metadata';
import * as metadataActions from 'src/actions/suite/metadataActions';
import { Account } from '@suite-common/wallet-types';
import { selectSelectedProviderForLabels } from 'src/reducers/suite/metadataReducer';

const LabelingViewer = styled.div`
    display: flex;
    flex-grow: 1;
    flex-direction: column;
`;

const StyledPre = styled.pre`
    font-size: 10px;
`;

const DecodedSection = styled.div`
    display: flex;
    flex-direction: row;
    margin: 8px 0;
    flex: 1;
`;

const DecodedItem = styled.div`
    padding: 8px;
    flex: 1;
    max-width: 50%;
    line-break: anywhere;
    overflow: hidden;
`;

const DecodedItemTitle = styled.div`
    margin-bottom: 4px;
    font-size: 16px;
    font-weight: 500;
`;

interface MetadataItemProps {
    fileName: string;
    aesKey: string;
    selectedProvider: MetadataProvider;
}

const MetadataItem = ({ selectedProvider, fileName, aesKey }: MetadataItemProps) => {
    const [custom, setCustom] = useState(undefined);

    const onSelect = (file: File, setError: (msg: any) => void) => {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const decrypted = metadataUtils.decrypt(
                    // @ts-expect-error
                    metadataUtils.arrayBufferToBuffer(reader.result),
                    aesKey,
                );
                console.log(decrypted);
                setCustom(decrypted);
            } catch (err) {
                setError({ id: 'TR_DROPZONE_ERROR', values: { error: err.message } });
            }
        };
        reader.onerror = () => {
            setError({ id: 'TR_DROPZONE_ERROR', values: { error: reader.error!.message } });
            reader.abort();
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <DecodedSection>
            <DecodedItem>
                <DecodedItemTitle>Fetched from {selectedProvider.type}</DecodedItemTitle>
                {!selectedProvider.data?.[fileName] && 'No data found'}
                {selectedProvider.data?.[fileName] && (
                    <StyledPre>
                        {JSON.stringify(selectedProvider.data[fileName] || {}, null, 2)}
                    </StyledPre>
                )}
            </DecodedItem>
            <DecodedItem>
                <DecodedItemTitle>Compare with a local file</DecodedItemTitle>
                {!custom && (
                    <DropZone
                        accept=".mtdt"
                        icon="SEARCH"
                        onSelect={onSelect}
                        placeholder="Upload file"
                    />
                )}
                {custom && <StyledPre>{JSON.stringify(custom, null, 2)}</StyledPre>}
                {custom && <Button onClick={() => setCustom(undefined)}>Clear</Button>}
            </DecodedItem>
        </DecodedSection>
    );
};

export const Metadata = () => {
    const { metadata, accounts } = useSelector(state => ({
        metadata: state.metadata,
        accounts: state.wallet.accounts,
    }));
    const selectedProvider = useSelector(selectSelectedProviderForLabels);
    const { disconnectProvider } = useActions({
        disconnectProvider: metadataActions.disconnectProvider,
    });

    const [selectedAccountPath, setSelectedAccountPath] = useState(undefined);
    const selectedAccount = useMemo(
        () => accounts.find(a => a.path === selectedAccountPath),
        [accounts, selectedAccountPath],
    );

    const getLabel = (a: Account) => `${a.symbol} - ${a.path} - ${a.metadata[1]?.fileName}`;

    if (!metadata.enabled || !selectedProvider?.clientId) {
        return (
            <SectionItem>
                <TextColumn
                    title="No labeling data"
                    description="Go back to Suite and enable labeling"
                />
            </SectionItem>
        );
    }
    return (
        <>
            <SectionItem>
                <TextColumn
                    title="Compare data in provider with locally decoded metadata file"
                    description={`type: ${selectedProvider.type}, clientId: ${selectedProvider.clientId}, connected user: ${selectedProvider.user}`}
                />
                <ActionColumn>
                    <Button
                        onClick={() =>
                            disconnectProvider({
                                clientId: selectedProvider.clientId,
                                dataType: 'labels',
                                removeMetadata: false,
                            })
                        }
                    >
                        {' '}
                        Disconnect
                    </Button>
                </ActionColumn>
            </SectionItem>
            <SectionItem>
                <LabelingViewer>
                    <Select
                        onChange={(selected: any) => {
                            setSelectedAccountPath(selected.value);
                        }}
                        value={{
                            label: selectedAccount ? getLabel(selectedAccount) : 'Select account',
                        }}
                        isClearable={false}
                        options={accounts.map(a => ({
                            label: getLabel(a),
                            value: a.path,
                        }))}
                        isClean
                        hideTextCursor
                    />

                    {/* todo: constant */}
                    {selectedAccount && selectedAccount.metadata[1] && (
                        <MetadataItem
                            selectedProvider={selectedProvider}
                            fileName={selectedAccount.metadata[1].fileName}
                            aesKey={selectedAccount.metadata[1].aesKey}
                        />
                    )}
                </LabelingViewer>
            </SectionItem>
        </>
    );
};
