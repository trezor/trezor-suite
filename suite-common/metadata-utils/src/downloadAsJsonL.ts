export const downloadAsJsonL = (data: any[], filename: string): void => {
    try {
        // Maps each object to its JSON string representation
        const jsonlString = data.map(obj => JSON.stringify(obj)).join('\n');

        const blob = new Blob([jsonlString], { type: 'application/jsonl' });

        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    } catch (error) {
        throw new Error(`Exporting JSONL failed: ${error}`);
    }
};
