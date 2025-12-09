import React, { useState, ChangeEvent } from 'react';

interface JsonlReaderProps<T> {
    onDataLoaded: (data: T[]) => void;
    onError?: (error: Error) => void;
}

export const JsonlReader = <T extends Record<string, any>>({
    onDataLoaded,
    onError,
}: JsonlReaderProps<T>) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        const reader = new FileReader();

        reader.onload = e => {
            const content = e.target?.result as string;

            try {
                // 1. Split by newline to get individual JSON strings
                // 2. Filter out empty lines (common at end of files)
                // 3. Parse each line
                const parsedData: T[] = content
                    .split('\n')
                    .filter(line => line.trim() !== '')
                    .map((line, index) => {
                        try {
                            return JSON.parse(line);
                        } catch (parseError) {
                            throw new Error(
                                `Error parsing JSON on line ${index + 1}: ${parseError}`,
                            );
                        }
                    });

                onDataLoaded(parsedData);
            } catch (err) {
                if (onError && err instanceof Error) {
                    onError(err);
                } else {
                    console.error(err);
                }
            } finally {
                setIsLoading(false);
            }
        };

        reader.onerror = () => {
            setIsLoading(false);
            if (onError) onError(new Error('Failed to read file'));
        };

        // Read the file as a plain text string
        reader.readAsText(file);
    };

    return (
        <div>
            <label>
                {isLoading ? 'Reading...' : 'Upload .jsonl File'}
                <input
                    type="file"
                    accept=".jsonl"
                    onChange={handleFileChange}
                    disabled={isLoading}
                />
            </label>
        </div>
    );
};

