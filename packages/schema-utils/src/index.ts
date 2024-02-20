/* eslint-disable @typescript-eslint/no-use-before-define */
import { JavaScriptTypeBuilder, Static, TSchema, TObject, Optional, Kind } from '@sinclair/typebox';
import { ValueErrorType, Errors, ValueError } from '@sinclair/typebox/errors';
import { Mixin } from 'ts-mixer';

import { ArrayBufferBuilder, BufferBuilder, KeyofEnumBuilder, UintBuilder } from './custom-types';
import { InvalidParameter } from './errors';
import { setDeepValue } from './utils';

class CustomTypeBuilder extends Mixin(
    JavaScriptTypeBuilder,
    ArrayBufferBuilder,
    BufferBuilder,
    KeyofEnumBuilder,
    UintBuilder,
) {}

export function Validate<T extends TSchema>(schema: T, value: unknown): value is Static<T> {
    try {
        Assert(schema, value);

        return true;
    } catch (e) {
        return false;
    }
}

function FindErrorInUnion(error: ValueError) {
    const currentValue: any = error.value;
    const unionMembers: TSchema[] = error.schema.anyOf;
    const hasValidMember = unionMembers.find(unionSchema => Validate(unionSchema, currentValue));
    if (!hasValidMember) {
        // Find possible matches by literals
        const possibleMatchesByLiterals = unionMembers.filter(unionSchema => {
            if (unionSchema[Kind] !== 'Object') return false;

            return !Object.entries(unionSchema.properties as TObject['properties']).find(
                ([property, propertySchema]) =>
                    propertySchema.const && propertySchema.const !== currentValue[property],
            );
        });
        if (possibleMatchesByLiterals.length === 1) {
            // There is only one possible match
            Assert(possibleMatchesByLiterals[0], currentValue);
        } else if (possibleMatchesByLiterals.length > 1) {
            // Find match with least amount of errors
            const errorsOfPossibleMatches = possibleMatchesByLiterals.map(
                (matchSchema: TSchema) => ({
                    schema: matchSchema,
                    errors: [...Errors(matchSchema, currentValue)],
                }),
            );
            const sortedErrors = errorsOfPossibleMatches.sort(
                (a, b) => a.errors.length - b.errors.length,
            );
            const [bestMatch] = sortedErrors;
            Assert(bestMatch.schema, currentValue);
        }

        throw new InvalidParameter(error.message, error.path, error.type, error.value);
    }
}

export function Assert<T extends TSchema>(schema: T, value: unknown): asserts value is Static<T> {
    const errors = [...Errors(schema, value)];
    let [error] = errors;
    while (error) {
        if (error.path === '/' && errors.length > 1) {
            // This might be a nested error, try to find the root cause
        } else if (error.value == null && error.schema[Optional] === 'Optional') {
            // Optional can also accept null values
        } else if (error.type === ValueErrorType.Union) {
            // Drill down into the union
            FindErrorInUnion(error);
        } else if (error.type === ValueErrorType.Number && typeof error.value === 'string') {
            // String instead of number, try to autocast
            const currentValue = error.value;
            const parsedNumber = Number(currentValue);
            if (!Number.isNaN(parsedNumber) && currentValue === parsedNumber.toString()) {
                // Autocast successful
                const pathParts = error.path.slice(1).split('/');
                setDeepValue(value, pathParts, parsedNumber);
            } else {
                throw new InvalidParameter(error.message, error.path, error.type, error.value);
            }
        } else {
            throw new InvalidParameter(error.message, error.path, error.type, error.value);
        }
        errors.shift();
        [error] = errors;
    }
}

export function AssertWeak<T extends TSchema>(
    schema: T,
    value: unknown,
): asserts value is Static<T> {
    try {
        Assert(schema, value);
    } catch (e) {
        if (e instanceof InvalidParameter) {
            if (e.type === ValueErrorType.ObjectRequiredProperty) {
                // We consider this error to be serious
                throw e;
            }
            console.warn('Method params validation failed', e);
        } else {
            throw e;
        }
    }
}

export const Type = new CustomTypeBuilder();
export { Optional };
export type { Static, TObject, TSchema };
