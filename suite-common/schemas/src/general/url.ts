import { isHttps } from '@trezor/utils';
import { z } from '@trezor/zod';

export const httpsUrl = z.string().refine((value): boolean => isHttps(value));
