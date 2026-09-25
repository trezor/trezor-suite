import z from 'zod';

import { isHttps } from '@trezor/utils';

export const httpsUrl = z.string().refine((value): boolean => isHttps(value));
