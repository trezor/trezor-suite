export function parseJSON(json: string): unknown {
    try {
        return JSON.parse(json);
    } catch {
        return undefined;
    }
}
