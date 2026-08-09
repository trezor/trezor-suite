import { useRef, useState } from 'react';

import { useDevice } from '@suite/device';
import { Input } from '@trezor/components';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { attestAddressThunk, verifyAttestationThunk } from 'src/actions/suite/contactsThunks';
import { useDispatch } from 'src/hooks/suite';
import { encodeAttestation } from 'src/utils/contacts/attestation';

/**
 * PoC scope: the address to attest is the first native-segwit testnet receive
 * address. A shipping version would let the user pick any account/address; that
 * needs the account model, and none of the security properties depend on it.
 */
const DEMO_PATH = "m/84'/1'/0'/0/0";
const DEMO_SLIP44 = 1;

/** Bob: prove one of my addresses is mine. */
export const ShareAddressRow = () => {
    const dispatch = useDispatch();
    const { device, isLocked } = useDevice();
    const [isLoading, setIsLoading] = useState(false);
    const [blob, setBlob] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAttest = async () => {
        setError(null);
        setIsLoading(true);
        try {
            // the address is resolved from the device itself, then attested
            const attestation = await dispatch(
                attestAddressThunk({ slip44: DEMO_SLIP44, path: DEMO_PATH }),
            ).unwrap();
            setBlob(encodeAttestation(attestation));
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SectionItem>
            <TextColumn
                title="Share a verified address"
                description={
                    error ??
                    blob ??
                    'Your Trezor confirms the address and signs it with your contact identity.'
                }
                data-testid="@contacts/attestation/blob"
            />
            <ActionColumn>
                <ActionButton
                    size="small"
                    onClick={handleAttest}
                    isDisabled={!device?.state?.staticSessionId || isLocked()}
                    isLoading={isLoading}
                    data-testid="@contacts/attestation/share"
                >
                    Attest address
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};

/** Alice: check an attestation against a contact I confirmed on my device. */
export const VerifyAddressRow = () => {
    const dispatch = useDispatch();
    const inputRef = useRef<HTMLInputElement>(null);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleVerify = async () => {
        setError(null);
        setResult(null);
        try {
            const { attestation, label } = await dispatch(
                verifyAttestationThunk({ raw: inputRef.current?.value ?? '' }),
            ).unwrap();
            setResult(`Verified: ${attestation.address} belongs to ${label}`);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    };

    return (
        <SectionItem>
            <TextColumn
                title="Verify a received address"
                description={
                    error ??
                    result ??
                    'Paste what a contact shared. Verified against their identity.'
                }
                data-testid="@contacts/attestation/result"
            />
            <ActionColumn>
                <Input
                    innerRef={inputRef}
                    placeholder="attestation"
                    data-testid="@contacts/attestation/input"
                />
                <ActionButton
                    size="small"
                    onClick={handleVerify}
                    data-testid="@contacts/attestation/verify"
                >
                    Verify
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
