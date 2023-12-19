const CELL_DELIMITERS = [',', ';', '\t', '|', '^'];
// const LINE_DELIMITERS = ['\r\n', '\r', '\n'];

type Result = { [key: string]: string };

const occurrences = (text: string, delimiter: string) => {
    // special chars needs to be escaped in RegExp
    const specialChars = '!@#$^&%*()+=-[]/{}|:<>?,.';
    const escaped = specialChars.indexOf(delimiter) >= 0 ? '\\' : '';
    const regExp = new RegExp(escaped + delimiter, 'g');
    return (text.match(regExp) || []).length;
};

const detectDelimiter = (text: string, delimiters: string[]) => {
    let index = 0;
    let frequency = 0;
    delimiters
        .map(d => occurrences(text, d)) // calculate occurrences
        .forEach((f, i) => {
            // find greatest occurrence
            if (f > frequency) {
                index = i;
                frequency = f;
            }
        });
    return delimiters[index];
};

const parseLine = (line: string, delimiter: string, columns: string[]) => {
    // skip empty lines
    if (!line.length) return {};
    // split string to cells using delimiter
    const cells = line.split(delimiter);
    const output: Result = {};
    cells.forEach((value, index) => {
        const key = columns[index];
        // strip double quotes and whitespace
        const cleanValue = value.replace(/^"|"$/g, '').trim();
        if (typeof key === 'string') {
            // skip csv header (value is one of column keys)
            if (!columns.includes(cleanValue.toLowerCase())) {
                output[key] = cleanValue;
            }
        } else {
            // use index as a key
            output[index] = cleanValue;
        }
    });
    return output;
};

export const parseCSV = (text: string, columns: string[] = [], delimiter?: string) => {
    // detect delimiter
    const d = delimiter || detectDelimiter(text, CELL_DELIMITERS);
    // normalize new line delimiter and split into lines
    const lines = text.replace(/(?:\r|\r\n|\n\n)/g, '\n').split('\n');

    const result: Result[] = [];
    lines.forEach(line => {
        const output = parseLine(line, d, columns);
        if (Object.keys(output).length) {
            // use only valid lines
            result.push(output);
        }
    });
    return result;
};
