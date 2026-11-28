import { type FunctionComponent, useState } from 'react';
import { useSelector } from 'react-redux';

import {
    type SignAddressesRootState,
    type SignVerifyReporterDep,
    getReadyDevice,
    selectAccountSignAddresses,
} from '@suite-common/sign-verify';
import { type TxKeyPath, useTranslate } from '@suite-native/intl';
import { SignVerify } from '@suite-native/sign-verify';
import {
    BITCOIN_DEFAULT_SIGNATURE_FORMAT,
    type BitcoinSignatureFormat,
    type SignBitcoinMessageDep,
    type VerifyBitcoinMessageDep,
    getBitcoinSignatureFormats,
} from '@trezor/network-bitcoin-suite-common';
import { type BitcoinNetworkSymbol } from '@trezor/network-bitcoin-types';
import type { SignVerifyProps } from '@trezor/network-module-suite-native-types';

const FORMAT_LABELS: Record<BitcoinSignatureFormat, TxKeyPath> = {
    trezor: 'signAndVerify.format.values.trezor',
    electrum: 'signAndVerify.format.values.electrum',
};

export type BitcoinSignVerifyComponentDeps = SignBitcoinMessageDep &
    VerifyBitcoinMessageDep &
    SignVerifyReporterDep;

export type BitcoinSignVerifyComponent = FunctionComponent<SignVerifyProps<BitcoinNetworkSymbol>>;

export const createBitcoinSignVerifyComponent =
    (deps: BitcoinSignVerifyComponentDeps): BitcoinSignVerifyComponent =>
    ({ networkSymbol, account }) => {
        const { translate } = useTranslate();

        const [format, setFormat] = useState<BitcoinSignatureFormat>(
            BITCOIN_DEFAULT_SIGNATURE_FORMAT,
        );

        const formats = getBitcoinSignatureFormats(networkSymbol, account.accountType);
        const isFormatSelectable = formats.length > 1;

        const addressGroups = useSelector((state: SignAddressesRootState) =>
            selectAccountSignAddresses(state, account),
        );

        return (
            <SignVerify>
                <SignVerify.Tabs pages={['sign', 'verify']} />
                <SignVerify.SignForm
                    sign={async ({ device, path, message, hex }) => {
                        const readyDevice = getReadyDevice(device, 'signMessage');
                        const result = readyDevice.success
                            ? await deps.signBitcoinMessage(networkSymbol, {
                                  device: readyDevice.payload,
                                  path,
                                  message,
                                  hex,
                                  format,
                              })
                            : readyDevice;
                        deps.signVerifyReporter.reportSign(
                            // Only an account offering the choice reports the format the user
                            // picked.
                            {
                                symbol: networkSymbol,
                                hex,
                                signatureFormat: isFormatSelectable ? format : undefined,
                            },
                            result,
                        );

                        return result;
                    }}
                >
                    {isFormatSelectable && (
                        <SignVerify.Format
                            options={formats.map(value => ({
                                value,
                                label: translate(FORMAT_LABELS[value]),
                            }))}
                            value={format}
                            onChange={setFormat}
                        />
                    )}
                    <SignVerify.AddressSelect addressGroups={addressGroups} />
                    <SignVerify.Message />
                    <SignVerify.Signature />
                </SignVerify.SignForm>
                <SignVerify.VerifyForm
                    verify={async ({ device, address, message, signature, hex }) => {
                        const readyDevice = getReadyDevice(device, 'verifyMessage');
                        const result = readyDevice.success
                            ? await deps.verifyBitcoinMessage(networkSymbol, {
                                  device: readyDevice.payload,
                                  address,
                                  message,
                                  signature,
                                  hex,
                              })
                            : readyDevice;
                        deps.signVerifyReporter.reportVerify(
                            { symbol: networkSymbol, hex },
                            result,
                        );

                        return result;
                    }}
                >
                    <SignVerify.AddressInput />
                    <SignVerify.Message />
                    <SignVerify.Signature />
                </SignVerify.VerifyForm>
            </SignVerify>
        );
    };
