import fs from 'fs';
import path from 'path';

const fixturesPath = './fixtures';
const filePath = path.join(__dirname, fixturesPath);
const fileName = process.argv[process.argv.length - 1];

const raw = fs.readFileSync(path.join(filePath, fileName), 'utf-8');

const json = JSON.parse(raw);

const requests = json.log.entries
    .filter((entry: any) => entry.request.url.startsWith('http://127.0.0.1:21325'))
    .map((entry: any) => ({
        request: {
            method: entry.request.method,
            url: entry.request.url.replace('http://127.0.0.1:21325', ''),
            postData: entry.request.postData,
        },
        response: {
            status: entry.response.status,
            statusText: entry.response.statusText,
            headers: entry.response.headers.filter((header: any) =>
                ['access-control-allow-origin', 'content-length', 'date', 'content-type'].includes(
                    header.name.toLowerCase(),
                ),
            ),
            content: entry.response.content,
        },
    }));

fs.writeFileSync(
    path.join(filePath, fileName.replace('.har', '.js')),
    `export default ${JSON.stringify(requests, null, 2)}`,
);

// todo remove original HAR file
