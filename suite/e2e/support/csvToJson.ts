export const csvToJson = (data: string) => {
    const lines = data.split('\n');
    const result = [];
    const headerLine = lines[0];
    if (!headerLine) {
        return [];
    }
    const headers = headerLine.split(',');
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        const obj: Record<string, string> = {};
        const currentline = line.split(',');

        for (let j = 0; j < headers.length; j++) {
            const header = headers[j];
            const value = currentline[j];
            if (header) {
                obj[header] = value ?? '';
            }
        }
        result.push(obj);
    }

    return result;
};
