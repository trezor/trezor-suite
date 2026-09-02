import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { TokenAddress } from '@suite-common/wallet-types';

export type ReceiveQRCodeCardProps = {
    address: string;
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
    qrCodeSize: number;
    onCopyAddress: () => Promise<void>;
};

export type ReceiveQRCodeContentProps = Omit<ReceiveQRCodeCardProps, 'onCopyAddress'>;
