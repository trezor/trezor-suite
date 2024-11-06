import React, { useState } from 'react';

import { randomBytes } from 'crypto';
import styled from 'styled-components';

import TrezorConnect from '@trezor/connect';
import { Button, Checkbox, Input } from '@trezor/components';
import type { PasswordEntry, PasswordEntryDecoded } from '@suite-common/metadata-types';
import { selectDevice } from '@suite-common/wallet-core';
import { isUrl } from '@trezor/utils';
import { spacingsPx } from '@trezor/theme';

import { usePasswords, useSelector } from 'src/hooks/suite';
import * as metadataUtils from 'src/utils/suite/metadata';
import { PATH } from 'src/actions/suite/constants/metadataPasswordsConstants';
import { getDisplayKey } from 'src/utils/suite/passwords';

const FormWrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: ${spacingsPx.md};
`;

// horizontal box for tags
const TagsSelection = styled.div`
    display: flex;
    flex-direction: row;
    column-gap: ${spacingsPx.md};
`;

interface Props {
    onEncrypted: (entry: PasswordEntry) => void;
    entry?: PasswordEntryDecoded;
    cancel: () => void;
}

export const EntryForm = ({ onEncrypted, entry, cancel }: Props) => {
    const [title, setTitle] = useState<string>(entry?.title || '');
    const [note, setNote] = useState<string>(entry?.note || '');
    const [username, setUsername] = useState<string>(entry?.username || '');
    const [password, setPassword] = useState<string>(entry?.password || '');
    const [secretNote, setSecretNote] = useState<string>(entry?.safe_note || '');
    const [selectedTags, setSelectedTags] = useState<number[]>(entry?.tags || []);

    const [inProgress, setInProgress] = useState(false);

    const { tags } = usePasswords();
    const device = useSelector(selectDevice);

    const encrypt = () => {
        if (inProgress || !device) return;

        setInProgress(true);
        const nonce = randomBytes(32).toString('hex');
        TrezorConnect.cipherKeyValue({
            device: { path: device.path },
            override: true,
            useEmptyPassphrase: true,
            path: PATH,
            key: getDisplayKey(title, username),
            value: nonce,
            encrypt: true,
            askOnDecrypt: true,
            askOnEncrypt: false,
        })
            .then(result => {
                if (!result.success) {
                    throw new Error(result.payload.error);
                }

                return Promise.all([
                    metadataUtils.encrypt(password, Buffer.from(nonce, 'hex')),
                    metadataUtils.encrypt(secretNote, Buffer.from(nonce, 'hex')),
                    Promise.resolve(result.payload.value),
                ]);
            })
            .then(([encryptedPassword, encryptedSafeNote, nonce2]) => {
                onEncrypted({
                    title,
                    username,
                    password: encryptedPassword,

                    note,
                    safe_note: encryptedSafeNote,

                    nonce: nonce2,
                    tags: selectedTags,
                });
            })
            .catch(error => {
                console.error(error);
            })
            .finally(() => {
                setInProgress(false);
            });
    };

    return (
        <FormWrapper>
            <Input
                // obviously, this doesn't make sense to have this logic inside the placeholder. I added it here
                // for documentation purposes (this is how it was done in the old TPM)
                //  in cases there should be a title over this input instead of placeholder
                // eslint-disable-next-line no-nested-ternary
                placeholder={!note ? 'item / url *' : isUrl(note) ? 'url *' : 'item *'}
                value={note}
                onChange={event => setNote(event.target.value)}
            />

            <Input
                placeholder="title"
                value={title}
                onChange={event => {
                    setTitle(event.target.value);
                }}
            />

            <Input
                placeholder="username"
                value={username}
                onChange={event => setUsername(event.target.value)}
            />

            <Input
                placeholder="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
            />

            <Input
                placeholder="secret note"
                value={secretNote}
                onChange={event => setSecretNote(event.target.value)}
            />

            <TagsSelection>
                {Object.entries(tags)
                    .filter(([key]) => key !== '0') // filter out '0' (All tag)
                    .map(([key, value]) => {
                        const keyInt = Number.parseInt(key, 10);

                        return (
                            <Checkbox
                                key={key} // key should be unique
                                isChecked={selectedTags.includes(keyInt)}
                                onClick={() => {
                                    setSelectedTags(
                                        selectedTags.includes(keyInt)
                                            ? selectedTags.filter(tag => tag !== keyInt)
                                            : [...selectedTags, keyInt],
                                    );
                                }}
                            >
                                {value.title}
                            </Checkbox>
                        );
                    })}
            </TagsSelection>

            <Button size="small" variant="tertiary" onClick={() => cancel()}>
                Cancel
            </Button>
            <Button
                size="small"
                onClick={encrypt}
                // note is a required field
                isDisabled={!note}
            >
                Submit
            </Button>
        </FormWrapper>
    );
};
