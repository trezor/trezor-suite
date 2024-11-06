import styled from 'styled-components';

import { selectDevice } from '@suite-common/wallet-core';

import type { PasswordEntry as PasswordEntryType } from 'src/types/suite/metadata';
import { useSelector } from 'src/hooks/suite';
import { TextColumn } from 'src/components/suite';

import { AddEntryButton } from './AddEntryButton';
import {
    PasswordEntry as PasswordEntryComponent,
    PasswordEntryCol,
    PasswordEntryRow,
} from './PasswordEntry';
import { EntryForm } from './EntryForm';

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
    entriesByTag: Record<number, PasswordEntryType>;
    entries: Record<number, PasswordEntryType>;
    savePasswords: (nextId: number, entry: PasswordEntryType) => void;
    setFormActive: (entry: number | null) => void;
    formActive: number | null;
    fileName: string;
    nextId: number;
}

export const PasswordsList = ({
    isSomeTagSelected,
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
                <PasswordEntryHeaderCol>item/url</PasswordEntryHeaderCol>
                <PasswordEntryHeaderCol>username</PasswordEntryHeaderCol>
                <PasswordEntryHeaderCol>secret note</PasswordEntryHeaderCol>
                <PasswordEntryHeaderCol>password</PasswordEntryHeaderCol>
                <PasswordEntryHeaderCol></PasswordEntryHeaderCol>
            </PasswordEntryRow>

            {(isSomeTagSelected
                ? [...Object.entries(entriesByTag)]
                : [...Object.entries(entries)]
            ).map(([key, entry]) => (
                <PasswordEntryComponent
                    {...entry}
                    devicePath={device!.path}
                    key={key}
                    index={Number(key)}
                    onEncrypted={entry => {
                        savePasswords(Number(key), entry);
                        setFormActive(null);
                    }}
                    formActive={formActive}
                    setFormActive={setFormActive}
                />
            ))}
            {!Object.entries(entries).length && (
                <TextColumn description={`No passwords found in file ${fileName}`} />
            )}
            {formActive === nextId && (
                <EntryForm
                    cancel={() => setFormActive(null)}
                    onEncrypted={entry => {
                        savePasswords(nextId, entry);
                        setFormActive(null);
                    }}
                />
            )}

            {formActive === null && <AddEntryButton onClick={() => setFormActive(nextId)} />}
        </Wrapper>
    );
};
