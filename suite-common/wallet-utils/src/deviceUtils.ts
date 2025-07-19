import { TrezorDevice } from '@suite-common/suite-types';
import { WalletDescriptor } from '@suite-common/wallet-types';
import { StaticSessionId } from '@trezor/connect';

export const parseDeviceStaticSessionId = (deviceStaticSessionId: StaticSessionId) => {
    const [walletDescriptor] = deviceStaticSessionId.split('@');

    return {
        walletDescriptor: walletDescriptor as WalletDescriptor,
    };
};

export const isApprovalFlowSupported = (device: TrezorDevice | undefined) =>
    !device?.unavailableCapabilities?.['evmApproval'];
