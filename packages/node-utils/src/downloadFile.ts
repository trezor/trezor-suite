import fetch from 'cross-fetch';
import path from 'path';
import fs from 'fs';

export const downloadFile = (url: string, filePath: string) =>
    new Promise((resolve, reject) => {
        fetch(url)
            .then(res => {
                // Check if the request is successful
                if (!res.ok) {
                    throw new Error(`Failed to fetch ${res.statusText}`);
                }
                return res.body;
            })
            .then(stream => {
                // Ensure the directory exists
                const dir = path.dirname(filePath);
                fs.mkdirSync(dir, { recursive: true });

                // Create a file stream
                const file = fs.createWriteStream(filePath);

                if (stream) {
                    // Pipe the response stream to the file stream
                    (stream as any).pipe(file);
                }
                file.on('error', err => {
                    file.close();
                    reject(err);
                });

                file.on('finish', () => {
                    file.close();
                    resolve(filePath);
                });
            })
            .catch(err => {
                console.error('Error: ', err.message);
                reject(err.message);
            });
    });
