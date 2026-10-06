import type { XrplAPI } from '@trezor/network-ripple/types';

import type { ContextType } from '../baseWorker';

export type Context = ContextType<XrplAPI>;

export type Request<T> = T & Context;
