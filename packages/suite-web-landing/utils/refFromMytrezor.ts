export const refFromMytrezor = () => {
    // Parse url parameters: ["key=value", "key=value", ...] => {key: value, key: value, ...}
    const map = Object.fromEntries(
        window.location.search
            .slice(1)
            .split('&')
            .map((q: string) => {
                const result: Array<string | boolean> = q.split('=');
                if (result[1] === 'true') {
                    result[1] = true;
                } else if (result[1] === 'false') {
                    result[1] = false;
                }
                return result;
            }),
    );
    return map.fromMytrezor || false;
};
