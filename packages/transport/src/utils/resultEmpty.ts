import { WRONG_ENVIRONMENT } from '../errors';
import { error } from './result';

export const emptyAbortable = () => ({
    promise: Promise.resolve(error({ error: WRONG_ENVIRONMENT })),
    abort: () => {},
});

export const empty = () => Promise.resolve(error({ error: WRONG_ENVIRONMENT }));

export const emptySync = () => error({ error: WRONG_ENVIRONMENT });
