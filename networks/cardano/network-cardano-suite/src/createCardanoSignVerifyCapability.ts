import type { AccountWithNetworkType } from '@suite-common/wallet-types';
import {
    getAddressParameters,
    getDerivationType,
    getNetworkId,
    getProtocolMagic,
    getStakingPath,
} from '@suite-common/wallet-utils';
import type TrezorConnect from '@trezor/connect';
import { PROTO } from '@trezor/connect';
import { getSerializedPath } from '@trezor/connect-common';
import type {
    SignVerifyCapability,
    SignVerifyCapabilityHelpers,
} from '@trezor/network-module-suite-types';

type CardanoSignVerifyConnect = Pick<typeof TrezorConnect, 'cardanoSignMessage'>;

export const createCardanoSignVerifyCapability = (
    trezorConnect: CardanoSignVerifyConnect,
    {
        getAccountAddressesForSigning,
    }: Pick<SignVerifyCapabilityHelpers, 'getAccountAddressesForSigning'>,
): SignVerifyCapability => ({
    getSignAddresses: (account, touchedAddresses) => {
        const cardanoAccount = account as AccountWithNetworkType<'cardano'>;

        return [
            {
                path: getStakingPath(cardanoAccount),
                address: cardanoAccount.misc.staking.address,
                category: 'TR_STAKING_STAKE_ADDRESS',
            },
            ...getAccountAddressesForSigning(cardanoAccount, touchedAddresses),
        ];
    },
    sign: ({ account, device, path, coin, message, hex, signOption }) => {
        const cardanoAccount = account as AccountWithNetworkType<'cardano'>;
        const payload = hex ? message : Buffer.from(message, 'utf8').toString('hex');
        const serializedPath = typeof path === 'string' ? path : getSerializedPath(path);
        const stakingPath = getStakingPath(cardanoAccount);
        const addressParameters =
            path === stakingPath
                ? {
                      addressType: PROTO.CardanoAddressType.REWARD,
                      stakingPath,
                  }
                : getAddressParameters(cardanoAccount, serializedPath);

        const params = {
            device,
            path,
            coin,
            message,
            hex,
            no_script_type: false,
            payload,
            addressParameters,
            protocolMagic: getProtocolMagic(cardanoAccount.symbol),
            networkId: getNetworkId(),
            derivationType: getDerivationType(cardanoAccount.accountType),
        };

        return trezorConnect.cardanoSignMessage(params).then(response =>
            response.success
                ? {
                      ...response,
                      payload: {
                          signature: response.payload.coseSignature,
                          additionalResult: signOption
                              ? response.payload.coseKey
                              : response.payload.pubKey,
                          address: response.payload.headers.protected.address,
                      },
                  }
                : response,
        );
    },
    formatSignedMessage: ({ signature }) => signature ?? '',
    copyButtonTranslationId: 'TR_COPY_TO_CLIPBOARD',
});
