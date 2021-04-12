export interface MessageObject {
    message: string;
    description?: string;
}

const createRowArray = (masterKey: string, masterValue: MessageObject) => [
    masterKey,
    masterValue.message,
    masterValue.description,
];

export default createRowArray;
