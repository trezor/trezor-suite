import { asNetworkSymbol, getNetworkOptional } from '@suite-common/wallet-config';
import { getDescriptorForNetworkType } from '@suite-common/wallet-utils';
import { TrezorBlockchain } from '@trezor/blockchain-core';
import {
    type CommonParams,
    type GetAccountInfo as GetAccountInfoParams,
    type Params,
} from '@trezor/connect';
import { TypedError } from '@trezor/connect-common/src/constants/errors';
import { getLabel } from '@trezor/connect-common/src/utils/pathUtils';
import { promiseAllSequence } from '@trezor/utils';

import {
    CommonPopupFlow,
    type PopupFlowAnswer,
    type PopupFlowPayload,
    getPayloadOrThrow,
} from './CommonPopupFlow';
import { connectPopupActions } from '../connectPopupActions';
import { describeCall, getCoinPermissions, getKnownCoinInfo, getRequests } from '../methodInfo';

// The backend reads an account only by its descriptor, so it's derived on the device for a path.
const getAccount = async (
    { path, ...request }: Params<GetAccountInfoParams>,
    device: NonNullable<CommonParams['device']>,
    signal: AbortSignal,
    isBundle = false,
) => {
    // A coin which isn't a Suite network is a bitcoin-like one only TrezorBlockchain has a backend for.
    const networkType = getNetworkOptional(request.coin.toLowerCase())?.networkType ?? 'bitcoin';
    const derived =
        path && typeof request.descriptor !== 'string'
            ? await getDescriptorForNetworkType({
                  device,
                  networkType,
                  path,
                  coin: asNetworkSymbol(request.coin),
                  derivationType: request.derivationType,
              }).then(getPayloadOrThrow)
            : undefined;

    const response = await TrezorBlockchain.getAccountInfo(
        {
            ...request,
            // The flow has rejected an account given by neither.
            descriptor: (derived?.descriptor ?? request.descriptor)!,
        },
        { signal },
    );
    // An account of a bundle the backend fails to read is answered with null, unless cancelled.
    if (isBundle && !response.success && response.error.code !== 'Method_Cancel') return null;

    return { ...getPayloadOrThrow(response), ...derived, path };
};

export class GetAccountInfo extends CommonPopupFlow<'getAccountInfo'> {
    protected getMethodInfo = async () => {
        const requests = getRequests(this.payload);
        const coinInfos = await Promise.all(requests.map(({ coin }) => getKnownCoinInfo(coin)));
        const [coinInfo] = coinInfos;

        return describeCall(
            requests.length > 1
                ? 'Export info of multiple accounts'
                : getLabel('Export #NETWORK account info', coinInfo),
            getCoinPermissions('read_account_info', coinInfos),
        );
    };

    protected validate() {
        const requests = this.payload.bundle ?? [this.payload];
        if (requests.some(({ path, descriptor }) => !path && typeof descriptor !== 'string')) {
            throw TypedError(
                'Method_InvalidParameter',
                'getAccountInfo: path or descriptor required',
            );
        }
    }

    protected async callMethod(payload: PopupFlowPayload<'getAccountInfo'>) {
        const device = this.getSelectedDevice();
        this.dispatch(connectPopupActions.setCallDevicePath(device.path));

        const { bundle, ...common } = payload;
        const accounts = bundle
            ? await promiseAllSequence(
                  bundle.map(
                      request => () =>
                          getAccount({ ...common, ...request }, device, this.signal, true),
                  ),
              )
            : await getAccount(payload, device, this.signal);

        return { success: true, payload: accounts } as PopupFlowAnswer;
    }
}
