import { useState } from 'react';
import { useSelector } from 'react-redux';

import { Translation, type TranslationKey } from '@suite/intl';
import {
    type SignAddressGroup,
    type SignAddressesRootState,
    injectSignVerify,
    selectAccountSignAddresses,
} from '@suite-common/sign-verify';
import { type Account } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { getStakingPath } from '@trezor/network-cardano-suite-common';
import { type SignatureFormat } from '@trezor/network-module-suite-common-types';

import { SignVerify } from './SignVerify';

// TODO: Hack: the app picks each network's Sign & Verify parts itself instead of the network
// module providing its own component. Remove as https://github.com/trezor/trezor-suite/issues/32472
// progresses.
const FORMAT_LABELS: Record<SignatureFormat, TranslationKey> = {
    trezor: 'TR_BIP_SIG_FORMAT',
    electrum: 'TR_COMPATIBILITY_SIG_FORMAT',
    raw: 'TR_PUBLIC_KEY_RAW',
    cose: 'TR_PUBLIC_KEY_COSE',
};

const getAccountAddressGroups = (
    account: Account,
    signAddressGroups: SignAddressGroup[],
): SignAddressGroup[] => {
    switch (account.networkType) {
        // Ethereum signs with the account itself, it has no address list.
        case 'ethereum':
            return [{ addresses: [{ address: account.descriptor, path: account.path }] }];
        case 'cardano':
            return [
                {
                    category: 'stake',
                    addresses: [
                        { path: getStakingPath(account), address: account.misc.staking.address },
                    ],
                },
                ...signAddressGroups,
            ];
        default:
            return signAddressGroups;
    }
};

type SignVerifyAccountProps = {
    account: Account;
};

export const SignVerifyAccount = ({ account }: SignVerifyAccountProps) => {
    const { signVerify } = useServices(injectSignVerify);
    const signAddressGroups = useSelector((state: SignAddressesRootState) =>
        selectAccountSignAddresses(state, account),
    );
    const [format, setFormat] = useState(signVerify.getDefaultFormat(account));

    const formats = signVerify.getFormats(account);
    const isVerifySupported = signVerify.isVerifySupported(account);
    const addressGroups = getAccountAddressGroups(account, signAddressGroups);
    const defaultAddress =
        account.networkType === 'ethereum' ? addressGroups[0]?.addresses[0] : undefined;

    return (
        <SignVerify>
            <SignVerify.Tabs>
                <SignVerify.Tab page="sign" />
                {isVerifySupported && <SignVerify.Tab page="verify" />}
            </SignVerify.Tabs>
            <SignVerify.SignForm
                defaultAddress={defaultAddress}
                sign={({ device, path, message, hex }) =>
                    signVerify.sign({ device, account, path, message, hex, format })
                }
            >
                {formats.length > 1 && format !== undefined && (
                    <SignVerify.Format
                        options={formats.map(value => ({
                            value,
                            label: <Translation id={FORMAT_LABELS[value]} />,
                        }))}
                        value={format}
                        onChange={setFormat}
                        tooltip={
                            formats.includes('electrum') ? (
                                <Translation
                                    id="TR_FORMAT_TOOLTIP"
                                    values={{
                                        FormatDescription: chunks => <p>{chunks}</p>,
                                        span: chunks => <strong>{chunks}</strong>,
                                    }}
                                />
                            ) : undefined
                        }
                    />
                )}
                <SignVerify.AddressSelect addressGroups={addressGroups} />
                <SignVerify.Message />
                <SignVerify.Signature />
                {account.networkType === 'cardano' && <SignVerify.PublicKey />}
            </SignVerify.SignForm>
            {isVerifySupported && (
                <SignVerify.VerifyForm
                    symbol={account.symbol}
                    verify={({ device, address, message, signature, hex }) =>
                        signVerify.verify({ device, account, address, message, signature, hex })
                    }
                >
                    <SignVerify.AddressInput />
                    <SignVerify.Message />
                    <SignVerify.Signature />
                </SignVerify.VerifyForm>
            )}
        </SignVerify>
    );
};
