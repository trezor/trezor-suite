import { CoreEventMessage } from '../events';
import type { CommonParams } from '../types';

export type PostMessage = (message: CoreEventMessage) => void;

export type FirmwareUpdateParams = {
    language?: string;
    baseUrl?: string;
    btcOnly?: boolean;
    binary?: ArrayBuffer;
} & CommonParams;
