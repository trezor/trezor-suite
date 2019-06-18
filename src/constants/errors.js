/* @flow */

const PREFIX = 'blockchain_link/';

const ERROR = {
    worker_not_found: 'Worker not found',
    worker_invalid: 'Invalid worker object',
    worker_timeout: 'Worker timeout',
    worker_runtime: undefined,
};

export class CustomError extends Error {
    code: string;

    message: string;

    constructor(code: string, message?: string) {
        super(message);

        if (typeof message === 'string') {
            this.message = message;
        }

        if (typeof code === 'string') {
            const c =
                code.indexOf(PREFIX) === 0 ? code.substring(PREFIX.length, code.length) : code;
            this.code = `${PREFIX}${c}`;
            if (ERROR[c] && typeof message !== 'string') {
                this.message = ERROR[c];
            }
        }

        if (typeof this.message !== 'string' || this.message === '') {
            this.message = 'Message not set';
        }
    }
}
