import { createContext } from '@trezor/utils';

export const earnYieldWorkerBaseUrl = createContext<`https://${string}/yield`>();
