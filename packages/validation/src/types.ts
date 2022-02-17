import { AnySchema } from 'yup';

declare module 'yup' {
    interface StringSchema {
        isAscii(): StringSchema;
        isHex(): StringSchema;
    }
}

// Type the yup schema shape
export type ValidationSchema<T> = Record<keyof T, AnySchema>;
