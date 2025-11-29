import { useState } from 'react';

import { useServices } from '@suite-common/redux-utils';
import { asEncryptedHex } from '@suite-common/secure-storage';
import { Button, ButtonGroup, Column, Textarea } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { Branded } from '@trezor/type-utils';

import { SettingsSection } from 'src/components/settings/SettingsSection';

import { SectionItem } from '../../../components/suite';

type Value = string & Branded<'Value'>;
const asValue = (value: string) => value as Value;

export const SecureStorage = () => {
    const [plaintext, setPlaintext] = useState(asValue(''));
    const [ciphertext, setCiphertext] = useState(asEncryptedHex<Value>(''));

    const services = useServices();

    const encrypt = async () => {
        const result = await services.secureStorage.encrypt({ value: plaintext });

        if (result.ok) {
            setCiphertext(result.value);
        } else {
            alert(`encrypt: [${result.error.type}] ${result.error.message}`);
        }
    };

    const decrypt = async () => {
        const result = await services.secureStorage.decrypt({ value: ciphertext });

        if (result.ok) {
            setPlaintext(result.value);
        } else {
            alert(`decrypt: [${result.error.type}]`);
        }
    };

    return (
        <SettingsSection title="Secure Storage">
            <SectionItem>
                <Column gap={spacings.md} flex="1">
                    <Textarea
                        label="Plaintext"
                        value={plaintext}
                        onChange={e => setPlaintext(asValue(e.target.value))}
                        rows={1}
                    />

                    <Textarea
                        label="Ciphertext"
                        value={ciphertext}
                        onChange={e => setCiphertext(asEncryptedHex(e.target.value))}
                        rows={1}
                    />
                    <ButtonGroup>
                        <Button onClick={encrypt}>Encrypt</Button>
                        <Button onClick={decrypt}>Decrypt</Button>
                    </ButtonGroup>
                </Column>
            </SectionItem>
        </SettingsSection>
    );
};
