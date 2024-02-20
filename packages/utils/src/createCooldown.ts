/**
 * Function returned by `createCooldown` returns `true` only when previous `true` was returned
 * `cooldownMs` or more millis ago, and `false` otherwise. First call always returns `true`.
 */
export const createCooldown = (cooldownMs: number) => {
    let last = 0;

    return () => {
        const now = Date.now();
        if (now - last >= cooldownMs) {
            last = now;

            return true;
        }

        return false;
    };
};
