import { type FunctionComponent } from 'react';
import { useSelector } from 'react-redux';

import {
    type SignAddressGroup,
    type SignAddressesRootState,
    type SignVerifyReporterDep,
    selectAccountSignAddresses,
} from '@suite-common/sign-verify';
import { type TxKeyPath, useTranslate } from '@suite-native/intl';
import { SignVerifyForms } from '@suite-native/sign-verify';
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
    ({ account }) => {
        const { symbol } = account;
        const { translate } = useTranslate();
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
            <SignVerifyForms
                addressGroups={[stakeGroup, ...addressGroups]}
                formats={CARDANO_SIGNATURE_FORMATS.map(value => ({
                    value,
                    label: translate(FORMAT_LABELS[value]),
                }))}
                defaultFormat={CARDANO_DEFAULT_SIGNATURE_FORMAT}
                signMessage={({
                    device,
                    path,
                    message,
                    hex,
                    format = CARDANO_DEFAULT_SIGNATURE_FORMAT,
                }) =>
                    deps.signVerifyReporter.signAndReport({ device, symbol, hex }, readyDevice =>
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
            />
        );
    };
