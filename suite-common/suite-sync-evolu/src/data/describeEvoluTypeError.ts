import { type TypeError } from '@evolu/common';

const isTypeError = (value: unknown): value is TypeError =>
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof value.type === 'string';

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

/**
 * Evolu type errors embed the rejected `value`, which for Suite Sync rows means labels,
 * descriptors and addresses. Only the discriminator path is kept, e.g.
 * `Object.Props.label.Union.Null,MaxLength`.
 */
export const describeEvoluTypeError = (error: TypeError): string => {
    const describeNestedErrors = (errors: unknown): string => {
        if (Array.isArray(errors)) {
            return errors
                .flatMap(nestedError =>
                    isTypeError(nestedError) ? [describeEvoluTypeError(nestedError)] : [],
                )
                .join(',');
        }

        if (isRecord(errors)) {
            return Object.entries(errors)
                .flatMap(([key, nestedError]) =>
                    isTypeError(nestedError)
                        ? [`${key}.${describeEvoluTypeError(nestedError)}`]
                        : [],
                )
                .join(',');
        }

        return '';
    };

    const segments: string[] = [error.type];

    if ('parentError' in error && isTypeError(error.parentError)) {
        segments.push(describeEvoluTypeError(error.parentError));
    }

    if ('errors' in error) {
        segments.push(describeNestedErrors(error.errors));
    }

    if ('reason' in error && isRecord(error.reason) && typeof error.reason.kind === 'string') {
        segments.push(error.reason.kind);

        if ('errors' in error.reason) {
            segments.push(describeNestedErrors(error.reason.errors));
        }
    }

    return segments.filter(segment => segment !== '').join('.');
};
