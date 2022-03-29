/**
 * Asks device to initiate seed backup procedure
 */
import type { Messages } from '@trezor/transport';
import type { CommonParams, Response } from '../params';

export declare function backupDevice(params?: CommonParams): Response<Messages.Success>;
