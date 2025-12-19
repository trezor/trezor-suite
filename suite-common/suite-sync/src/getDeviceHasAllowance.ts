import type { WalletDescriptor } from '@suite-common/wallet-types';

export type GetDeviceHasAllowance = ({
    walletDescriptor,
    deviceId,
}: {
    walletDescriptor: WalletDescriptor;
    deviceId: string;
}) => boolean;
