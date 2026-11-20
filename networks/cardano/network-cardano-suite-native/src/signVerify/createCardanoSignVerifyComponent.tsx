import { type FunctionComponent, useState } from 'react';
import { useSelector } from 'react-redux';

import {
    type SignAddressGroup,
    type SignAddressesRootState,
    type SignVerifyReporterDep,
    getReadyDevice,
    selectAccountSignAddresses,
} from '@suite-common/sign-verify';
import { type TxKeyPath, useTranslate } from '@suite-native/intl';
import { SignVerify } from '@suite-native/sign-verify';
import {
    CARDANO_DEFAULT_SIGNATURE_FORMAT,
    CARDANO_SIGNATURE_FORMATS,
    type CardanoSignatureFormat,
    type SignCardanoMessageDep,
    getStakingPath,
} from '@trezor/network-cardano-suite-common';
import { type CardanoNetworkSymbol } from '@trezor/network-cardano-types';
import type { SignVerifyProps } from '@trezor/network-module-suite-native-types';

const FORMAT_LABELS: Record<CardanoSignatureFormat, TxKeyPath> = {
    raw: 'signAndVerify.format.values.rawKey',
    cose: 'signAndVerify.format.values.cose',
};

export type CardanoSignVerifyComponentDeps = SignCardanoMessageDep & SignVerifyReporterDep;

export type CardanoSignVerifyComponent = FunctionComponent<SignVerifyProps<CardanoNetworkSymbol>>;

export const createCardanoSignVerifyComponent =
    (deps: CardanoSignVerifyComponentDeps): CardanoSignVerifyComponent =>
    ({ networkSymbol, account }) => {
        const { translate } = useTranslate();
        const [format, setFormat] = useState<CardanoSignatureFormat>(
            CARDANO_DEFAULT_SIGNATURE_FORMAT,
        );
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

        return (
            <SignVerify>
                <SignVerify.Tabs pages={['sign']} />
                <SignVerify.SignForm
                    sign={async ({ device, path, message, hex }) => {
                        const readyDevice = getReadyDevice(device, 'signMessage');
                        const result = readyDevice.success
                            ? await deps.signCardanoMessage(networkSymbol, {
                                  device: readyDevice.payload,
                                  accountIndex: account.index,
                                  accountType: account.accountType,
                                  path,
                                  message,
                                  hex,
                                  format,
                              })
                            : readyDevice;
                        deps.signVerifyReporter.reportSign({ symbol: networkSymbol, hex }, result);

                        return result;
                    }}
                >
                    <SignVerify.Format
                        options={CARDANO_SIGNATURE_FORMATS.map(value => ({
                            value,
                            label: translate(FORMAT_LABELS[value]),
                        }))}
                        value={format}
                        onChange={setFormat}
                    />
                    <SignVerify.AddressSelect addressGroups={[stakeGroup, ...addressGroups]} />
                    <SignVerify.Message />
                    <SignVerify.Signature />
                </SignVerify.SignForm>
            </SignVerify>
        );
    };
