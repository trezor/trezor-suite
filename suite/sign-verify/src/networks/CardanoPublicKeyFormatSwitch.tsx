import { Translation } from '@suite/intl';

import { FormatSwitch } from '../FormatSwitch';
import { useSignedMessage } from '../SignedMessageContext';

type CardanoPublicKeyFormatSwitchProps = {
    isCose: boolean;
    onChange: (isCose: boolean) => void;
};

export const CardanoPublicKeyFormatSwitch = ({
    isCose,
    onChange,
}: CardanoPublicKeyFormatSwitchProps) => {
    const signedMessage = useSignedMessage();

    return (
        <FormatSwitch
            options={[
                { value: false, label: <Translation id="TR_PUBLIC_KEY_RAW" /> },
                { value: true, label: <Translation id="TR_PUBLIC_KEY_COSE" /> },
            ]}
            isDisabled={signedMessage !== undefined}
            selectedOption={isCose}
            onChange={onChange}
            data-testid="@sign-verify/cardano-pubkey-format"
        />
    );
};
