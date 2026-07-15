import type { CardanoSignMessage, CardanoSignedMessage } from './common';
import type { Params, Response } from '../../params';

export declare function cardanoSignMessage(
    params: Params<CardanoSignMessage>,
): Response<CardanoSignedMessage>;
