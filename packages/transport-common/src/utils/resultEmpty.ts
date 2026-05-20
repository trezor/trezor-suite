import { WRONG_ENVIRONMENT } from '../errors';
import { error } from './result';

export const empty = () => Promise.resolve(error({ code: WRONG_ENVIRONMENT }));

export const emptySync = () => error({ code: WRONG_ENVIRONMENT });
