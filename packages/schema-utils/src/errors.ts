import { ValueErrorType } from '@sinclair/typebox/errors';

export class InvalidParameter extends Error {
    field: string;
    type: ValueErrorType;

    constructor(reason: string, field: string, type: ValueErrorType, value?: any) {
        let message = `Invalid parameter`;
        message += ` "${field.substring(1)}"`;
        message += ` (= ${JSON.stringify(value)})`;
        message += `: ${reason.replace(/'/g, '"')}`;
        super(message);
        this.name = 'InvalidParameter';
        this.field = field;
        this.type = type;
    }
}
