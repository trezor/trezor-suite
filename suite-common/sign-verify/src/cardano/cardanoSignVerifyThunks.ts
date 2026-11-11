import { type Account } from '@suite-common/wallet-types';
import {
    getAddressParameters,
    getDerivationType,
    getNetworkId,
    getProtocolMagic,
    getStakingPath,
} from '@suite-common/wallet-utils';
import TrezorConnect, { PROTO } from '@trezor/connect';

import { signMessageThunk } from '../signMessageThunk';

type SignCardanoMessageThunkParams = {
    account: Account;
    path: string;
    message: string;
    hex: boolean;
    /** Returns the public key as a COSE key instead of a raw one. */
    isCose: boolean;
};

const getCardanoAddressParameters = (account: Account, path: string) => {
    const stakingPath = getStakingPath(account);

    return path === stakingPath
        ? { addressType: PROTO.CardanoAddressType.REWARD, stakingPath }
        : getAddressParameters(account, path);
};

export const signCardanoMessageThunk = ({
    account,
    path,
    message,
    hex,
    isCose,
}: SignCardanoMessageThunkParams) =>
    signMessageThunk({
        account,
        hex,
        signMessage: async device => {
            const response = await TrezorConnect.cardanoSignMessage({
                device,
                path,
                payload: hex ? message : Buffer.from(message, 'utf8').toString('hex'),
                addressParameters: getCardanoAddressParameters(account, path),
                protocolMagic: getProtocolMagic(account.symbol),
                networkId: getNetworkId(),
                derivationType: getDerivationType(account.accountType),
            });

            return response.success
                ? {
                      ...response,
                      payload: {
                          signature: response.payload.coseSignature,
                          pubKey: isCose ? response.payload.coseKey : response.payload.pubKey,
                          address: response.payload.headers.protected.address,
                      },
                  }
                : response;
        },
    });
