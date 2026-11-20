import * as fs from 'fs';
import * as path from 'path';

/**
 * Detox writes one `device.log` per test into `artifacts/<configuration>.<timestamp>/<test name>/`
 * and one `<device id> <timestamp>.startup.log` per session next to them (see the `log` artifact
 * plugin in `.detoxrc.js`). Detox's own `detox_pid_*.log` files are runner output, not device
 * output, and are skipped.
 */
export const isDeviceLogFile = (fileName: string): boolean =>
    fileName === 'device.log' || fileName.endsWith('.startup.log');

const listFilesRecursively = (directory: string): string[] => {
    const entries = fs.readdirSync(directory, { withFileTypes: true });

    return entries.flatMap(entry => {
        const entryPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            return listFilesRecursively(entryPath);
        }

        return isDeviceLogFile(entry.name) ? [entryPath] : [];
    });
};

export const findDeviceLogFiles = (artifactsDir: string): string[] => {
    if (!fs.existsSync(artifactsDir)) {
        return [];
    }

    try {
        return listFilesRecursively(artifactsDir).toSorted();
    } catch {
        return [];
    }
};

export const readDeviceLogs = (artifactsDir: string): string[] =>
    findDeviceLogFiles(artifactsDir).flatMap(filePath => {
        try {
            return [fs.readFileSync(filePath, 'utf8')];
        } catch {
            return [];
        }
    });
