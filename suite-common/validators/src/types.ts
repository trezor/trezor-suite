export {};

declare module 'yup' {
    interface StringSchema {
        isAscii(): StringSchema;
        isHex(): StringSchema;
    }
}
