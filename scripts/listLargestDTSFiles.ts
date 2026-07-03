import fs from 'node:fs';
import path from 'node:path';

type FileSize = {
    bytes: number;
    path: string;
};

const rootDir = path.resolve(import.meta.dirname, '..');

const excludedDirectoryNames = new Set(['.git', '.nx', '.yarn', 'coverage', 'node_modules', 'tmp']);

const parseLimit = (args: string[]): number => {
    const limitArg = args.find(arg => arg.startsWith('--limit='));
    if (!limitArg) {
        return 20;
    }

    const limit = Number(limitArg.replace('--limit=', ''));
    if (!Number.isInteger(limit) || limit < 1) {
        throw new Error(`Invalid --limit value: ${limitArg}`);
    }

    return limit;
};

const formatBytes = (bytes: number): string => {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    const units = ['KiB', 'MiB', 'GiB'] as const;
    let value = bytes / 1024;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex++;
    }

    return `${value.toFixed(2)} ${units[unitIndex]}`;
};

const isDTSFile = (filePath: string): boolean =>
    filePath.endsWith('.d.ts') || filePath.endsWith('.d.mts') || filePath.endsWith('.d.cts');

const collectDTSFiles = (directory: string, files: FileSize[] = []): FileSize[] => {
    const entries = fs.readdirSync(directory, { withFileTypes: true });

    entries.forEach(entry => {
        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            if (!excludedDirectoryNames.has(entry.name)) {
                collectDTSFiles(fullPath, files);
            }

            return;
        }

        if (entry.isFile() && isDTSFile(fullPath)) {
            files.push({
                bytes: fs.statSync(fullPath).size,
                path: path.relative(rootDir, fullPath).replaceAll('\\', '/'),
            });
        }
    });

    return files;
};

const printLargestFiles = (files: FileSize[], limit: number) => {
    const largestFiles = files.sort((a, b) => b.bytes - a.bytes).slice(0, limit);
    const sizeColumnWidth = Math.max(...largestFiles.map(file => formatBytes(file.bytes).length));
    const bytesColumnWidth = Math.max(...largestFiles.map(file => file.bytes.toString().length));

    console.log(`Largest declaration files in ${rootDir}`);
    console.log(`Showing ${largestFiles.length} of ${files.length} files\n`);

    largestFiles.forEach((file, index) => {
        const rank = `${index + 1}.`.padStart(3, ' ');
        const size = formatBytes(file.bytes).padStart(sizeColumnWidth, ' ');
        const bytes = `${file.bytes} bytes`.padStart(bytesColumnWidth + ' bytes'.length, ' ');

        console.log(`${rank} ${size}  ${bytes}  ${file.path}`);
    });
};

try {
    const limit = parseLimit(process.argv.slice(2));
    const dtsFiles = collectDTSFiles(rootDir);

    if (dtsFiles.length === 0) {
        console.log(`No declaration files found in ${rootDir}`);
        process.exit(0);
    }

    printLargestFiles(dtsFiles, limit);
} catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
}
