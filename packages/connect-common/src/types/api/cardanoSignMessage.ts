import type { Params, Response } from '../params';
import type { CardanoSignMessage, CardanoSignedMessage } from './cardano';

export declare function cardanoSignMessage(
    params: Params<CardanoSignMessage>,
): Response<CardanoSignedMessage>;
