import { type AnySchema } from 'yup';

// Type the yup schema shape
export type ValidationSchema<T> = Record<keyof T, AnySchema>;
