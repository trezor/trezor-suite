import { type FunctionComponent, useState } from 'react';
import { useSelector } from 'react-redux';

import { Translation, type TranslationKey } from '@suite/intl';
import { SignVerify } from '@suite/sign-verify';
import {
    type SignAddressGroup,
    type SignAddressesRootState,
    type SignVerifyReporterDep,
    selectAccountSignAddresses,
} from '@suite-common/sign-verify';
import {
    CARDANO_DEFAULT_SIGNATURE_FORMAT,
    CARDANO_SIGNATURE_FORMATS,
    type CardanoSignatureFormat,
    type SignCardanoMessageDep,
    getStakingPath,
} from '@trezor/network-cardano-suite-common';
import { type CardanoNetworkSymbol } from '@trezor/network-cardano-types';
import type { SignVerifyProps } from '@trezor/network-module-suite-types';

const FORMAT_LABELS: Record<CardanoSignatureFormat, TranslationKey> = {
    raw: 'TR_PUBLIC_KEY_RAW',
    cose: 'TR_PUBLIC_KEY_COSE',
};

const FORMAT_OPTIONS = CARDANO_SIGNATURE_FORMATS.map(value => ({
    value,
    label: <Translation id={FORMAT_LABELS[value]} />,
}));

export type CardanoSignVerifyComponentDeps = SignCardanoMessageDep & SignVerifyReporterDep;

export type CardanoSignVerifyComponent = FunctionComponent<SignVerifyProps<CardanoNetworkSymbol>>;

export const createCardanoSignVerifyComponent =
    (deps: CardanoSignVerifyComponentDeps): CardanoSignVerifyComponent =>
    ({ account }) => {
        const addressGroups = useSelector((state: SignAddressesRootState) =>
            selectAccountSignAddresses(state, account),
        );
        const stakeGroup: SignAddressGroup = {
            category: 'stake',
            addresses: [
                {
                    path: getStakingPath(account),
                    address: account.networkType === 'cardano' ? account.misc.staking.address : '',
                },
            ],
        };

        const [format, setFormat] = useState<CardanoSignatureFormat>(
            CARDANO_DEFAULT_SIGNATURE_FORMAT,
        );

        const { symbol } = account;

        return (
            <SignVerify>
                <SignVerify.Tabs>
                    <SignVerify.Tab page="sign" />
                </SignVerify.Tabs>
                <SignVerify.SignForm
                    sign={({ device, path, message, hex }) =>
                        deps.signVerifyReporter.signAndReport(
                            { device, symbol, hex },
                            readyDevice =>
                                deps.signCardanoMessage({
                                    device: readyDevice,
                                    symbol,
                                    accountIndex: account.index,
                                    accountType: account.accountType,
                                    path,
                                    message,
                                    hex,
                                    format,
                                }),
                        )
                    }
                >
                    <SignVerify.Format
                        options={FORMAT_OPTIONS}
                        value={format}
                        onChange={setFormat}
                    />
                    <SignVerify.AddressSelect addressGroups={[stakeGroup, ...addressGroups]} />
                    <SignVerify.Message />
                    <SignVerify.Signature />
                    <SignVerify.PublicKey />
                </SignVerify.SignForm>
            </SignVerify>
        );
    };
