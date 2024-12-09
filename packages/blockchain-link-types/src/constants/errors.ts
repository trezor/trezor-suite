const PREFIX = 'blockchain_link/';

const ERROR: { [key: string]: string | undefined } = {
    connect: undefined,
    worker_not_found: 'Worker not found',
    worker_invalid: 'Invalid worker object',
    worker_timeout: 'Worker timeout',
    worker_unknown_request: 'Unknown message type:',
    worker_runtime: undefined,
    invalid_param: 'Invalid parameter:',
    websocket_not_initialized: 'WebSocket not initialized',
    websocket_no_url: 'Cannot connect because no server was specified',
    websocket_timeout: 'Websocket timeout',
    websocket_error_message: undefined,
    websocket_runtime_error: undefined,
};

export class CustomError extends Error {
    code: string | undefined;

    message = '';

    constructor(codeOrMessage: string, message = '') {
        // test reports that super is not covered, TODO: investigate more
        super(message);

        this.message = message;

        if (typeof codeOrMessage === 'string') {
            const isPrefixed = codeOrMessage.indexOf(PREFIX) === 0;
            const code = isPrefixed ? codeOrMessage.substring(PREFIX.length) : codeOrMessage;
            const knownCode = Object.keys(ERROR).includes(code);
            if (isPrefixed || knownCode) {
                this.code = `${PREFIX}${code}`;
                const codeMessage = ERROR[code];
                if (codeMessage) {
                    if (this.message === '') {
                        this.message = codeMessage;
                    } else if (message.indexOf('+') === 0) {
                        this.message = `${codeMessage} ${message.substring(1)}`;
                    }
                }
            } else if (this.message === '') {
                this.message = code;
            }
        }

        if (typeof this.message !== 'string' || this.message === '') {
            this.message = 'Message not set';
        }
    }
}
