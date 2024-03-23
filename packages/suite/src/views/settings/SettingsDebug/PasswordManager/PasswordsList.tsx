import styled from 'styled-components';

import { AddEntryButton } from './AddEntryButton';
import {
    PasswordEntry as PasswordEntryComponent,
    PasswordEntryCol,
    PasswordEntryRow,
} from './PasswordEntry';
import type { PasswordEntry as PasswordEntryType } from 'src/types/suite/metadata';
// import { EntryForm } from './EntryForm';

import { useSelector } from 'src/hooks/suite';
import { TextColumn } from 'src/components/suite';
import { selectDevice } from '@suite-common/wallet-core';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    flex: 1;
`;

const PasswordEntryHeaderCol = styled(PasswordEntryCol)`
    font-weight: 600;
    text-decoration: underline;
`;

interface PasswordsListProps {
    isSomeTagSelected: boolean;
    isAllTagSelected: boolean;
    entriesByTag: Record<number, PasswordEntryType>;
    entries: Record<number, PasswordEntryType>;
    savePasswords: (nextId: number, entry: PasswordEntryType) => void;
    setFormActive: (entry?: number) => void;
    formActive?: number;
    fileName: string;
    nextId: number;
}

export const PasswordsList = ({
    isSomeTagSelected,
    isAllTagSelected,
    entriesByTag,
    entries,
    savePasswords,
    setFormActive,
    formActive,
    fileName,
    nextId,
}: PasswordsListProps) => {
    const device = useSelector(selectDevice);
    return (
        <Wrapper>
            <PasswordEntryRow>
                <PasswordEntryHeaderCol>title/url</PasswordEntryHeaderCol>
                <PasswordEntryHeaderCol>username</PasswordEntryHeaderCol>
                <PasswordEntryHeaderCol>secret note</PasswordEntryHeaderCol>
                <PasswordEntryHeaderCol>password</PasswordEntryHeaderCol>
                <PasswordEntryHeaderCol></PasswordEntryHeaderCol>
            </PasswordEntryRow>

            {(isSomeTagSelected && !isAllTagSelected
                ? Object.entries(entriesByTag)
                : Object.entries(entries)
            ).map(([key, entry]) => (
                <PasswordEntryComponent
                    {...entry}
                    devicePath={device!.path}
                    key={key}
                    index={Number(key)}
                    // todo: on edited
                    onEncrypted={entry => {
                        savePasswords(Number(key), entry);
                        setFormActive(undefined);
                    }}
                    formActive={formActive}
                    setFormActive={setFormActive}
                />
            ))}
            {!Object.entries(entries).length && (
                <TextColumn description={`No passwords found in file ${fileName}`} />
            )}
            {/* {formActive === nextId && (
                <EntryForm
                    cancel={() => setFormActive(undefined)}
                    onEncrypted={entry => {
                        savePasswords(nextId, entry);
                        setFormActive(undefined);
                    }}
                />
            )} */}

            {!formActive && <AddEntryButton onClick={() => setFormActive(nextId)} />}
        </Wrapper>
    );
};
