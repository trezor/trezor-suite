import { useTranslation } from '@suite/intl';
import { Input } from '@trezor/components';

import { CopyFieldButton } from '../CopyFieldButton';
import { useSignedMessage } from '../SignedMessageContext';
import { useSignVerifyCopyValue } from '../useSignVerifyCopyValue';

export const CardanoPublicKeyField = () => {
    const signedMessage = useSignedMessage();

    const { translationString } = useTranslation();
    const copyValue = useSignVerifyCopyValue();

    const pubKey = signedMessage?.pubKey ?? '';

    return (
        <Input
            label={translationString('TR_PUBLIC_KEY')}
            type="text"
            readOnly
            value={pubKey}
            isDisabled={!pubKey.length}
            placeholder={translationString('TR_SIGNATURE_AFTER_SIGNING_PLACEHOLDER')}
            rightContent={
                signedMessage ? (
                    <CopyFieldButton
                        onClick={() => copyValue(pubKey)}
                        data-testid="@sign-verify/copy-pubkey"
                    />
                ) : undefined
            }
            data-testid="@sign-verify/pubKey"
        />
    );
};
