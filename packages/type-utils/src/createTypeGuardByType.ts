type ValueWithType = {
    type: string;
};

/**
 * Creates a type guard for a discriminated union whose discriminator is named `type`.
 *
 * The structural primitive lives in this low-level package so packages such as `connect-common`
 * can use it without depending on Suite's Redux layer.
 */
export const createTypeGuardByType = <TValue extends ValueWithType>() =>
    function isValueOfType<TType extends TValue['type']>(
        value: { type: unknown },
        ...types: TType[]
    ): value is Extract<TValue, { type: TType }> {
        return types.some(type => value.type === type);
    };
