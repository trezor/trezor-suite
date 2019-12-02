export interface MessageObject {
    source: string;
    meta?: {
        comment?: string;
        occurrences?: string[];
    };
}

const createRowArray = (masterKey: string, masterValue: MessageObject, occurrences = false) => {
    const context = [];
    if (masterValue.meta) {
        if (masterValue.meta.comment) {
            context.push(masterValue.meta.comment);
        }
        // if (masterValue.meta.context) {
        //     context.push(`ID: ${masterValue.meta.context}.`);
        // }
        if (masterValue.meta.occurrences && occurrences) {
            context.push(`OCCURRENCES: ${masterValue.meta.occurrences.join(' ')}`);
        }
    }

    return [masterKey, masterValue.source, context.join(' ')];
};

export default createRowArray;
