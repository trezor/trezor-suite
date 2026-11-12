import { type TrezorDevice } from '@suite-common/suite-types';
import { type Account } from '@suite-common/wallet-types';
import {
    getAddressParameters,
    getDerivationType,
    getNetworkId,
    getProtocolMagic,
    getStakingPath,
} from '@suite-common/wallet-utils';
import TrezorConnect, { PROTO } from '@trezor/connect';
import { getSerializedPath } from '@trezor/connect-common';

type SignCardanoMessageParams = {
    device: TrezorDevice;
    account: Account;
    path: string | number[];
    message: string;
    hex: boolean;
    isCose: boolean;
};

export const signCardanoMessage = ({
    device,
    account,
    path,
    message,
    hex,
    isCose,
}: SignCardanoMessageParams) => {
    const payload = hex ? message : Buffer.from(message, 'utf8').toString('hex');
    const serializedPath = typeof path === 'string' ? path : getSerializedPath(path);
    const stakingPath = getStakingPath(account);
    const addressParameters =
        path === stakingPath
            ? {
                  addressType: PROTO.CardanoAddressType.REWARD,
                  stakingPath,
              }
            : getAddressParameters(account, serializedPath);

    return TrezorConnect.cardanoSignMessage({
        device,
        path,
        payload,
        addressParameters,
        protocolMagic: getProtocolMagic(account.symbol),
        networkId: getNetworkId(),
        derivationType: getDerivationType(account.accountType),
    }).then(response =>
        response.success
            ? {
                  ...response,
                  payload: {
                      signature: response.payload.coseSignature,
                      pubKey: isCose ? response.payload.coseKey : response.payload.pubKey,
                      address: response.payload.headers.protected.address,
                  },
              }
            : response,
    );
};
