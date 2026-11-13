import { type TrezorDevice } from '@suite-common/suite-types';
import TrezorConnect from '@trezor/connect';

type VerifyEthereumMessageParams = {
    device: TrezorDevice;
    address: string;
    message: string;
    signature: string;
    hex: boolean;
};

export const verifyEthereumMessage = ({
    device,
    address,
    message,
    signature,
    hex,
}: VerifyEthereumMessageParams) =>
    TrezorConnect.ethereumVerifyMessage({ device, address, message, signature, hex });
