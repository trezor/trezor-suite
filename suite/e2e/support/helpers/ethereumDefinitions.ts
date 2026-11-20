import {
    getDefinitionsVersionForFirmware,
    getEthereumDefinitionsBaseUrl,
} from '@trezor/connect-common';
import { ProtobufManager } from '@trezor/protobuf';
import * as definitionsProto from '@trezor/protobuf/src/definitions/messages-definitions_pb';
import { trzd } from '@trezor/protocol';
import type { VersionArray } from '@trezor/utils';

// 8 null bytes, not 4: the firmware asks for a name-only display format under this selector.
const NAME_ONLY_FUNCTION_SIGNATURE = '0000000000000000';

const protobufManager = ProtobufManager();
protobufManager.load(definitionsProto);

type GetAddressProviderNameParams = {
    chainId: number;
    address: string;
    firmwareVersion: VersionArray;
};

export const getAddressProviderName = async ({
    chainId,
    address,
    firmwareVersion,
}: GetAddressProviderNameParams): Promise<string | undefined> => {
    const baseUrl = getEthereumDefinitionsBaseUrl(
        getDefinitionsVersionForFirmware(firmwareVersion),
    );
    const lowerCaseAddress = address.replace(/^0x/, '').toLowerCase();
    const url = `${baseUrl}/chain-id/${chainId}/display-format/${lowerCaseAddress}-${NAME_ONLY_FUNCTION_SIGNATURE}.dat`;

    const response = await fetch(url);
    if (response.status === 404) {
        return undefined;
    }
    if (!response.ok) {
        throw new Error(`Unexpected status ${response.status} for ${url}`);
    }

    const { protobufPayload } = trzd.decode(await response.arrayBuffer());
    const { message } = protobufManager.decode('EthereumDisplayFormatInfo', protobufPayload);

    return 'provider_name' in message && typeof message.provider_name === 'string'
        ? message.provider_name
        : undefined;
};
