import { asNetworkSymbol, getNetworkOptional } from '@suite-common/wallet-config';
import { getDescriptorForNetworkType } from '@suite-common/wallet-utils';
import TrezorConnect, {
    type CommonParams,
    type GetAccountInfo as GetAccountInfoParams,
    type MethodInfo,
    type Params,
} from '@trezor/connect';
import { promiseAllSequence } from '@trezor/utils';

import {
    CommonPopupFlow,
    type PopupFlowAnswer,
    type PopupFlowPayload,
    getPayloadOrThrow,
} from './CommonPopupFlow';
import { connectPopupActions } from '../connectPopupActions';
import { mergePermissions } from '../permissions';

// Connect reads an account only by its descriptor, so it's derived on the device for a path.
const getAccount = async (
    { path, ...request }: Params<GetAccountInfoParams>,
    device: NonNullable<CommonParams['device']>,
) => {
    // A coin which isn't a Suite network is a bitcoin-like one only Connect has a backend for.
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

    const account = await TrezorConnect.getAccountInfo({
        ...request,
        descriptor: derived?.descriptor ?? request.descriptor,
    }).then(getPayloadOrThrow);

    return { ...account, ...derived, path };
};

export class GetAccountInfo extends CommonPopupFlow<'getAccountInfo'> {
    // Each account is described by Connect, with its path standing in for its descriptor.
    protected async getMethodInfo(): Promise<MethodInfo> {
        const requests = this.payload.bundle ?? [this.payload];
        const infos = await Promise.all(
            requests.map(({ path, ...request }) =>
                TrezorConnect.call({
                    ...request,
                    descriptor: request.descriptor ?? path,
                    method: 'getAccountInfo',
                    __info: true,
                }).then(getPayloadOrThrow<MethodInfo>),
            ),
        );

        return {
            info: infos.length === 1 ? infos[0]!.info : 'Export info of multiple accounts',
            requiredPermissions: infos.reduce<MethodInfo['requiredPermissions']>(
                (permissions, info) => mergePermissions(permissions, info.requiredPermissions),
                [],
            ),
            useUi: requests.some(
                ({ path, descriptor }) => !!path && typeof descriptor !== 'string',
            ),
        };
    }

    protected async callMethod(payload: PopupFlowPayload<'getAccountInfo'>) {
        const device = this.getSelectedDevice();
        this.dispatch(connectPopupActions.setCallDevicePath(device.path));

        const { bundle, ...common } = payload;
        // A failed account of a bundle is answered with null, unless the call is cancelled.
        const getBundleAccount = (request: GetAccountInfoParams) =>
            getAccount({ ...common, ...request }, device).catch(error => {
                if (error?.code === 'Method_Cancel') throw error;

                return null;
            });
        const accounts = bundle
            ? await promiseAllSequence(bundle.map(request => () => getBundleAccount(request)))
            : await getAccount(payload, device);

        return { success: true, payload: accounts } as PopupFlowAnswer;
    }
}
