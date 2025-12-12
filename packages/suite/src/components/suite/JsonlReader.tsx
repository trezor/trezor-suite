import React, { ChangeEvent, useState } from 'react';

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
                const parsedData: T[] = content
                    // Split by newline to get individual JSON strings
                    .split('\n')
                    // Filter out empty lines
                    .filter(line => line.trim() !== '')
                    // Parse each line
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

        reader.readAsText(file);
    };

    return (
        <div>
            <label>
                {isLoading ? 'Reading...' : ''}
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
