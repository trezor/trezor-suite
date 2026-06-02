type Options = { prefix?: 'required' | 'optional' | 'prohibited'; allowEmpty?: boolean };

export function isHex(
    value: unknown,
    options?: Options & { prefix?: 'required' },
): value is `0x${string}`;
export function isHex(
    value: unknown,
    options: Options & { prefix: 'optional' | 'prohibited' },
): value is string;

export function isHex(value: unknown, { prefix = 'required', allowEmpty = true }: Options = {}) {
    const p = prefix === 'prohibited' ? '' : '(0x)';
    const o = prefix === 'optional' ? '?' : '';
    const e = allowEmpty ? '*' : '+';
    const regex = `^${p}${o}[0-9a-fA-F]${e}$`;

    return typeof value === 'string' && new RegExp(regex).test(value);
}
