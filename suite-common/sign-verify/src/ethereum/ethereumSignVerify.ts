import { type TrezorDevice } from '@suite-common/suite-types';
import TrezorConnect from '@trezor/connect';

type SignEthereumMessageParams = {
    device: TrezorDevice;
    path: string | number[];
    message: string;
    hex: boolean;
};

export const signEthereumMessage = ({ device, path, message, hex }: SignEthereumMessageParams) =>
    TrezorConnect.ethereumSignMessage({ device, path, message, hex });

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
