import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';

import { TokenOfNetworkAlertBody } from '../../components/TokenOfNetworkAlertContent';

const CHECKSUM_LINK_URL = 'https://trezor.io/learn/a/evm-address-checksum-in-trezor-suite';

export const createChecksumAlert = (onPressPrimaryButton: () => void) => ({
    title: <Translation id="moduleSend.outputs.recipients.checksum.alert.title" />,
    description: (
        <Translation
            id="moduleSend.outputs.recipients.checksum.alert.body"
            values={{
                link: (linkChunk: React.ReactNode) => (
                    <Link
                        href={CHECKSUM_LINK_URL}
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
    accountKey: string,
    tokenContract: string,
    onPressPrimaryButton: () => void,
) => ({
    appendix: (
        <TokenOfNetworkAlertBody accountKey={accountKey} tokenContract={tokenContract as any} />
    ),
    primaryButtonTitle: <Translation id="generic.buttons.gotIt" />,
    onPressPrimaryButton,
});
