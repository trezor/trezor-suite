import { type FunctionComponent } from 'react';
import { useSelector } from 'react-redux';

import {
    type SignAddressesRootState,
    type SignVerifyReporterDep,
    selectAccountSignAddresses,
} from '@suite-common/sign-verify';
import { type TxKeyPath, useTranslate } from '@suite-native/intl';
import { SignVerifyForms } from '@suite-native/sign-verify';
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
    ({ account }) => {
        const { symbol } = account;
        const { translate } = useTranslate();

        const formats = getBitcoinSignatureFormats(symbol, account.accountType);
        const isFormatSelectable = formats.length > 1;

        const addressGroups = useSelector((state: SignAddressesRootState) =>
            selectAccountSignAddresses(state, account),
        );

        return (
            <SignVerifyForms
                addressGroups={addressGroups}
                formats={formats.map(value => ({ value, label: translate(FORMAT_LABELS[value]) }))}
                defaultFormat={BITCOIN_DEFAULT_SIGNATURE_FORMAT}
                signMessage={({
                    device,
                    path,
                    message,
                    hex,
                    format = BITCOIN_DEFAULT_SIGNATURE_FORMAT,
                }) =>
                    deps.signVerifyReporter.signAndReport(
                        {
                            device,
                            symbol,
                            hex,
                            // Only an account offering the choice reports the format the user
                            // picked.
                            signatureFormat: isFormatSelectable ? format : undefined,
                        },
                        readyDevice =>
                            deps.signBitcoinMessage({
                                device: readyDevice,
                                symbol,
                                path,
                                message,
                                hex,
                                format,
                            }),
                    )
                }
                verifyMessage={({ device, address, message, signature, hex }) =>
                    deps.signVerifyReporter.verifyAndReport({ device, symbol, hex }, readyDevice =>
                        deps.verifyBitcoinMessage({
                            device: readyDevice,
                            symbol,
                            address,
                            message,
                            signature,
                            hex,
                        }),
                    )
                }
            />
        );
    };
