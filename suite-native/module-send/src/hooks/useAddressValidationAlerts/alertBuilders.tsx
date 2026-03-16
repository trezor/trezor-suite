import { type AccountKey } from '@suite-common/wallet-types';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { HELP_CENTER_EVM_ADDRESS_CHECKSUM } from '@trezor/urls';

import { TokenOfNetworkAlertBody } from '../../components/TokenOfNetworkAlertContent';

export const createChecksumAlert = (onPressPrimaryButton: () => void) => ({
    title: <Translation id="moduleSend.outputs.recipients.checksum.alert.title" />,
    description: (
        <Translation
            id="moduleSend.outputs.recipients.checksum.alert.body"
            values={{
                link: (linkChunk: React.ReactNode) => (
                    <Link
                        href={HELP_CENTER_EVM_ADDRESS_CHECKSUM}
                        label={linkChunk}
                        isUnderlined
                        textColor="textSubdued"
                    />
                ),
            }}
        />
    ),
    primaryButtonTitle: (
        <Translation id="moduleSend.outputs.recipients.checksum.alert.primaryButton" />
    ),
    onPressPrimaryButton,
});

export const createContractAlert = (onPressPrimaryButton: () => void) => ({
    title: <Translation id="moduleSend.outputs.recipients.smartContract.alert.title" />,
    description: <Translation id="moduleSend.outputs.recipients.smartContract.alert.description" />,
    primaryButtonTitle: (
        <Translation id="moduleSend.outputs.recipients.smartContract.alert.primaryButton" />
    ),
    onPressPrimaryButton,
});

export const createTokenAlert = (
    accountKey: AccountKey,
    tokenContract: string,
    onPressPrimaryButton: () => void,
) => ({
    appendix: (
        <TokenOfNetworkAlertBody accountKey={accountKey} tokenContract={tokenContract as any} />
    ),
    primaryButtonTitle: <Translation id="generic.buttons.gotIt" />,
    onPressPrimaryButton,
});
