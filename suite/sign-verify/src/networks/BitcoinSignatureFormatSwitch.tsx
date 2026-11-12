import { Translation } from '@suite/intl';

import { FormatSwitch } from '../FormatSwitch';
import { useSignedMessage } from '../SignedMessageContext';

type BitcoinSignatureFormatSwitchProps = {
    isElectrum: boolean;
    onChange: (isElectrum: boolean) => void;
};

export const BitcoinSignatureFormatSwitch = ({
    isElectrum,
    onChange,
}: BitcoinSignatureFormatSwitchProps) => {
    const signedMessage = useSignedMessage();

    if (signedMessage) {
        return null;
    }

    return (
        <FormatSwitch
            options={[
                { value: false, label: <Translation id="TR_BIP_SIG_FORMAT" /> },
                { value: true, label: <Translation id="TR_COMPATIBILITY_SIG_FORMAT" /> },
            ]}
            tooltip={
                <Translation
                    id="TR_FORMAT_TOOLTIP"
                    values={{
                        FormatDescription: chunks => <p>{chunks}</p>,
                        span: chunks => <strong>{chunks}</strong>,
                    }}
                />
            }
            selectedOption={isElectrum}
            onChange={onChange}
            data-testid="@sign-verify/format"
        />
    );
};
