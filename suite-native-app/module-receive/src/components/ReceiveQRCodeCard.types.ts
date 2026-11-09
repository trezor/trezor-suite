import type { TokenAddress } from '@suite-common/tokens';
import type { NetworkSymbol } from '@suite-common/wallet-config';

export type ReceiveQRCodeCardProps = {
    address: string;
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
    tokenSymbol?: string;
    qrCodeSize: number;
    onCopyAddress: () => Promise<void>;
};

export type ReceiveQRCodeContentProps = Omit<ReceiveQRCodeCardProps, 'onCopyAddress'>;
