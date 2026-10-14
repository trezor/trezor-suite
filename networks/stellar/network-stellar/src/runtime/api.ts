import { NotFoundError } from '@stellar/stellar-sdk';

export { NotFoundError };

export const isNotFoundError = (error: unknown) => error instanceof NotFoundError;
