import { useState } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { type PlatformEncryptionDep, asEncryptedHex } from '@suite-common/platform-encryption';
import { Button, ButtonGroup, Column, Textarea } from '@trezor/components';
import { SectionItem, SettingsSection } from '@trezor/product-components';
import { spacings } from '@trezor/theme';
import { type Branded } from '@trezor/type-utils';

import { useLayoutSize } from 'src/hooks/suite';

type Value = string & Branded<'Value'>;
const asValue = (value: string) => value as Value;

export const PlatformEncryption = () => {
    const { isBelowLaptop } = useLayoutSize();
    const [plaintext, setPlaintext] = useState(asValue(''));
    const [ciphertext, setCiphertext] = useState(asEncryptedHex<Value>(''));

    const { platformEncryption } = useServices<PlatformEncryptionDep>();

    const encrypt = async () => {
        const result = await platformEncryption.encrypt({ value: plaintext });

        if (result.success) {
            setCiphertext(result.payload);
        } else {
            alert(`encrypt: [${result.error.type}] ${result.error.message}`);
        }
    };

    const decrypt = async () => {
        const result = await platformEncryption.decrypt({ value: ciphertext });

        if (result.success) {
            setPlaintext(result.payload);
        } else {
            alert(`decrypt: [${result.error.type}]`);
        }
    };

    return (
        <SettingsSection isBelowLaptop={isBelowLaptop} title="Platform Encryption">
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
