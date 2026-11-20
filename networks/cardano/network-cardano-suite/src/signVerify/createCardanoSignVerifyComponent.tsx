import { type FunctionComponent } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';

import { zodResolver } from '@hookform/resolvers/zod';

import { Translation, type TranslationKey } from '@suite/intl';
import { EMPTY_VALUES, SignVerify, type SignVerifyValues, signSchema } from '@suite/sign-verify';
import {
    type SignAddressGroup,
    type SignAddressesRootState,
    type SignVerifyReporterDep,
    getReadyDevice,
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
    ({ networkSymbol, account }) => {
        const addressGroups = useSelector((state: SignAddressesRootState) =>
            selectAccountSignAddresses(state, account),
        );
        const signForm = useForm<SignVerifyValues>({
        mode: 'onBlur',
        reValidateMode: 'onChange',
            resolver: zodResolver(signSchema),
            defaultValues: { ...EMPTY_VALUES, format: CARDANO_DEFAULT_SIGNATURE_FORMAT },
        });
        const stakeGroup: SignAddressGroup = {
            category: 'stake',
            addresses: [
                {
                    path: getStakingPath(account),
                    address: account.networkType === 'cardano' ? account.misc.staking.address : '',
                },
            ],
        };

        return (
            <SignVerify>
                <SignVerify.Tabs>
                    <SignVerify.Tab page="sign" />
                </SignVerify.Tabs>
                <SignVerify.SignForm
                    form={signForm}
                    sign={async ({ device, path, message, hex, format }) => {
                        const readyDevice = getReadyDevice(device, 'signMessage');
                        const result = readyDevice.success
                            ? await deps.signCardanoMessage(networkSymbol, {
                                  device: readyDevice.payload,
                                  accountIndex: account.index,
                                  accountType: account.accountType,
                                  path,
                                  message,
                                  hex,
                                  format:
                                      CARDANO_SIGNATURE_FORMATS.find(value => value === format) ??
                                      CARDANO_DEFAULT_SIGNATURE_FORMAT,
                              })
                            : readyDevice;
                        deps.signVerifyReporter.reportSign({ symbol: networkSymbol, hex }, result);

                        return result;
                    }}
                >
                    <SignVerify.Format options={FORMAT_OPTIONS} />
                    <SignVerify.AddressSelect addressGroups={[stakeGroup, ...addressGroups]} />
                    <SignVerify.Message />
                    <SignVerify.Signature />
                    <SignVerify.PublicKey />
                </SignVerify.SignForm>
            </SignVerify>
        );
    };
