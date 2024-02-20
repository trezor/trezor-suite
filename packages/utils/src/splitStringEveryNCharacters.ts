export function splitStringEveryNCharacters(value: string, n: number): string[] {
    if (n === 0) {
        return [];
    }

    const regex = new RegExp(`.{1,${n}}`, 'g');

    return value.match(regex) ?? [];
}
