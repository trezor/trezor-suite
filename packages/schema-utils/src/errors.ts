export class InvalidParameter extends Error {
    field?: string;

    constructor(reason: string, field: string, value?: any) {
        let message = `Invalid parameter`;
        message += ` "${field.substring(1)}"`;
        message += ` (= ${JSON.stringify(value)})`;
        message += `: ${reason.replace(/'/g, '"')}`;
        super(message);
        this.name = 'InvalidParameter';
        this.field = field;
    }
}
