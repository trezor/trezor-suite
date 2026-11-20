import { type FunctionComponent, useState } from 'react';
import { useSelector } from 'react-redux';

import { Translation, type TranslationKey } from '@suite/intl';
import { SignVerify } from '@suite/sign-verify';
import {
    type SignAddressesRootState,
    type SignVerifyReporterDep,
    selectAccountSignAddresses,
} from '@suite-common/sign-verify';
import {
    BITCOIN_DEFAULT_SIGNATURE_FORMAT,
    type BitcoinSignatureFormat,
    type SignBitcoinMessageDep,
    type VerifyBitcoinMessageDep,
    getBitcoinSignatureFormats,
} from '@trezor/network-bitcoin-suite-common';
import { type BitcoinNetworkSymbol } from '@trezor/network-bitcoin-types';
import type { SignVerifyProps } from '@trezor/network-module-suite-types';

const FORMAT_LABELS: Record<BitcoinSignatureFormat, TranslationKey> = {
    trezor: 'TR_BIP_SIG_FORMAT',
    electrum: 'TR_COMPATIBILITY_SIG_FORMAT',
};

export type BitcoinSignVerifyComponentDeps = SignBitcoinMessageDep &
    VerifyBitcoinMessageDep &
    SignVerifyReporterDep;

export type BitcoinSignVerifyComponent = FunctionComponent<SignVerifyProps<BitcoinNetworkSymbol>>;

export const createBitcoinSignVerifyComponent =
    (deps: BitcoinSignVerifyComponentDeps): BitcoinSignVerifyComponent =>
    ({ account }) => {
        const addressGroups = useSelector((state: SignAddressesRootState) =>
            selectAccountSignAddresses(state, account),
        );

        const [format, setFormat] = useState<BitcoinSignatureFormat>(
            BITCOIN_DEFAULT_SIGNATURE_FORMAT,
        );

        const { symbol } = account;
        const formats = getBitcoinSignatureFormats(symbol, account.accountType);
        const isFormatSelectable = formats.length > 1;

        return (
            <SignVerify>
                <SignVerify.Tabs>
                    <SignVerify.Tab page="sign" />
                    <SignVerify.Tab page="verify" />
                </SignVerify.Tabs>
                <SignVerify.SignForm
                    sign={({ device, path, message, hex }) =>
                        deps.signVerifyReporter.signAndReport(
                            {
                                device,
                                symbol,
                                hex,
                                // Only an account offering the choice reports the picked format.
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
                >
                    {isFormatSelectable && (
                        <SignVerify.Format
                            options={formats.map(value => ({
                                value,
                                label: <Translation id={FORMAT_LABELS[value]} />,
                            }))}
                            value={format}
                            onChange={setFormat}
                            tooltip={
                                <Translation
                                    id="TR_FORMAT_TOOLTIP"
                                    values={{
                                        FormatDescription: chunks => <p>{chunks}</p>,
                                        span: chunks => <strong>{chunks}</strong>,
                                    }}
                                />
                            }
                        />
                    )}
                    <SignVerify.AddressSelect addressGroups={addressGroups} />
                    <SignVerify.Message />
                    <SignVerify.Signature />
                </SignVerify.SignForm>
                <SignVerify.VerifyForm
                    symbol={symbol}
                    verify={({ device, address, message, signature, hex }) =>
                        deps.signVerifyReporter.verifyAndReport(
                            { device, symbol, hex },
                            readyDevice =>
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
                >
                    <SignVerify.AddressInput />
                    <SignVerify.Message />
                    <SignVerify.Signature />
                </SignVerify.VerifyForm>
            </SignVerify>
        );
    };
