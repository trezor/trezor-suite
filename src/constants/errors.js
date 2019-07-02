/* @flow */

const PREFIX = 'blockchain_link/';

const ERROR = {
    worker_not_found: 'Worker not found',
    worker_invalid: 'Invalid worker object',
    worker_timeout: 'Worker timeout',
    worker_runtime: undefined,
    invalid_param: 'Invalid parameter:',
    websocket_not_initialized: 'WebSocket not initialized',
    websocket_no_url: 'Cannot connect because no server was specified',
    websocket_error_message: undefined,
    websocket_runtime_error: undefined,
};

export class CustomError extends Error {
    code: string;

    message: string;

    constructor(code: string, message?: string | Array<string>) {
        super(message);

        if (typeof message === 'string') {
            this.message = message;
        }

        if (typeof code === 'string') {
            const c =
                code.indexOf(PREFIX) === 0 ? code.substring(PREFIX.length, code.length) : code;
            this.code = `${PREFIX}${c}`;
            if (ERROR[c]) {
                if (typeof message !== 'string') {
                    this.message = ERROR[c];
                } else if (message.indexOf('+') === 0) {
                    this.message = `${ERROR[c]} ${message.substr(1, message.length)}`;
                }
            }
        }

        if (typeof this.message !== 'string' || this.message === '') {
            this.message = 'Message not set';
        }
    }
}
