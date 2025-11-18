import { useState } from 'react';

import { Button, Column, Input, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { SettingsSection } from 'src/components/settings/SettingsSection';
import { ActionColumn, SectionItem } from 'src/components/suite';
import { desktopApi } from '@trezor/suite-desktop-api';
import { set } from 'date-fns';

export const EncryptedStorage = () => {
    const [text, setText] = useState('');
    const [key, setKey] = useState('');

    const [encryptedKeys, setEncryptedKeys] = useState<Record<string, string>>({});

    return (
        <SettingsSection title="Encrypted storage">
            <SectionItem>
                <ActionColumn>
                    <Column gap={spacings.xxs}>
                        <Input
                            value={key}
                            onChange={e => setKey(e.target.value)}
                            placeholder="key"
                        />
                    </Column>{' '}
                    <Column gap={spacings.xxs}>
                        <Input
                            value={text}
                            placeholder="text"
                            onChange={e => setText(e.target.value)}
                        />
                    </Column>
                </ActionColumn>
                <ActionColumn>
                    <Button
                        onClick={() =>
                            desktopApi
                                .bioAuthEncryptAndStore({
                                    string: text,
                                    storageKey: key,
                                })
                                .then(() => {
                                    setText('');
                                    setKey('');
                                    setEncryptedKeys(prev => ({
                                        ...prev,
                                        [key]: '****',
                                    }));
                                })
                        }
                        size="small"
                    >
                        encrypt
                    </Button>
                </ActionColumn>
            </SectionItem>
            <SectionItem>
                {Object.entries(encryptedKeys).map(([k, v]) => (
                    <Row key={k}>
                        {k}: {v}{' '}
                        {v === '****' && (
                            <Button
                                size="small"
                                onClick={() => {
                                    desktopApi
                                        .bioAuthDecryptFromStorage({ storageKey: k })
                                        .then(result => {
                                            console.log('decrypted result', result);
                                            setEncryptedKeys(prev => ({
                                                ...prev,
                                                [k]: result,
                                            }));
                                        })
                                        .catch(error => {
                                            alert(`Error: ${error.message}`);
                                        });
                                }}
                            >
                                decrypt
                            </Button>
                        )}
                    </Row>
                ))}
            </SectionItem>
        </SettingsSection>
    );
};
