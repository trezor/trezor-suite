import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';
import { transformProtocolParameters } from '@trezor/blockchain-link-utils/src/blockfrost';

import type { Request } from '../types';

export const getInfo = async (
    request: Request<MessageTypes.GetInfo>,
): Promise<Responses.GetInfo> => {
    const api = await request.connect();
    // The backend stays usable without protocol parameters; composing falls back to defaults.
    const [info, cardanoProtocolParameters] = await Promise.all([
        api.getServerInfo(),
        api.getProtocolParameters().then(transformProtocolParameters, () => undefined),
    ]);

    return {
        type: RESPONSES.GET_INFO,
        payload: {
            url: api.options.url,
            network: info.shortcut,
            ...info,
            cardanoProtocolParameters,
        },
    };
};
