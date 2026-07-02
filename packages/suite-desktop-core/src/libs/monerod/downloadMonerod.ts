import { spawn } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import https from 'https';
import path from 'path';

/**
 * Runtime download of the official `monerod` binary (the monero-gui model: the daemon
 * is fetched, not bundled, because the archive is large and the pruned chain is ~tens of GB).
 *
 * Integrity is verified against SHA-256 hashes pinned in source. The canonical hashes are
 * published on https://www.getmonero.org/downloads/hashes.txt and GPG-signed by binaryFate
 * (fingerprint 81AC591FE9C4B65C5806AFC3F0AF4D462A0BDF92). Verifying that signature and
 * deriving the pinned hashes from it is a follow-up hardening step before shipping.
 */

export const MONEROD_VERSION = 'v0.18.5.0';

// Official Monero CLI binaries are hosted on getmonero.org, NOT on GitHub releases.
const DOWNLOAD_BASE = 'https://downloads.getmonero.org/cli';

// SHA-256 of each release archive, taken from the GPG-signed hashes.txt published at
// https://www.getmonero.org/downloads/hashes.txt (signed by binaryFate). A missing pin =>
// the download is refused (the binary is executed, so it is never run unverified).
const ARCHIVE_SHA256: Record<string, string> = {
    'mac-x64': '79e03406046255d0f6a47e1fdcbbe677ab11ef7d9fcc4481252235361769292c',
    'mac-armv8': 'fb48fcef9302bf2f97821498ec791b4f693af4984702e72e588ce02209f8960d',
    'linux-x64': '166ad93036f95f5abeba24c8670061be022c9238dba2e6a7587611a1d759e294',
    'linux-armv8': 'd8f19b947ce46d468615bb7331962d4ca732e79b1ac6c5128fa509df3f6cc487',
    'win-x64': '027d96a72d36663b6f5cbcc5b1564c65c628a9f8f2bb9b4d9859c03f741cabc4',
};

type PlatformKey = keyof typeof ARCHIVE_SHA256;

const getPlatformKey = (): PlatformKey => {
    const { platform, arch } = process;
    if (platform === 'darwin') return arch === 'arm64' ? 'mac-armv8' : 'mac-x64';
    if (platform === 'linux') return arch === 'arm64' ? 'linux-armv8' : 'linux-x64';
    if (platform === 'win32') return 'win-x64';
    throw new Error(`Unsupported platform for monerod: ${platform}-${arch}`);
};

const getArchiveName = (key: PlatformKey) =>
    `monero-${key}-${MONEROD_VERSION}.${key.startsWith('win') ? 'zip' : 'tar.bz2'}`;

export const getMonerodBinaryName = () =>
    process.platform === 'win32' ? 'monerod.exe' : 'monerod';

export const getMonerodBinaryPath = (binDir: string) => path.join(binDir, getMonerodBinaryName());

export const isMonerodDownloaded = (binDir: string) => fs.existsSync(getMonerodBinaryPath(binDir));

type DownloadProgress = (current: number, total: number) => void;

const MAX_REDIRECTS = 5;

const downloadFile = (url: string, dest: string, onProgress: DownloadProgress) =>
    new Promise<void>((resolve, reject) => {
        const fail = (error: Error, fileStream?: fs.WriteStream) => {
            fileStream?.destroy();
            // Drop the partially-written archive so a later attempt doesn't reuse a truncated file.
            fs.rm(dest, { force: true }, () => reject(error));
        };

        const request = (currentUrl: string, redirects: number) => {
            https
                .get(currentUrl, response => {
                    // Follow redirects (the getmonero.org URL may point at a download mirror).
                    if (
                        response.statusCode &&
                        response.statusCode >= 300 &&
                        response.statusCode < 400 &&
                        response.headers.location
                    ) {
                        if (redirects >= MAX_REDIRECTS) {
                            reject(new Error('Download failed: too many redirects'));

                            return;
                        }
                        let next: URL;
                        try {
                            // Resolve relative redirect targets against the current URL.
                            next = new URL(response.headers.location, currentUrl);
                        } catch {
                            reject(new Error('Download failed: invalid redirect location'));

                            return;
                        }
                        if (next.protocol !== 'https:') {
                            reject(new Error('Download failed: refusing non-https redirect'));

                            return;
                        }
                        request(next.toString(), redirects + 1);

                        return;
                    }
                    if (response.statusCode !== 200) {
                        reject(new Error(`Download failed with status ${response.statusCode}`));

                        return;
                    }

                    const total = Number(response.headers['content-length'] ?? 0);
                    let transferred = 0;
                    const fileStream = fs.createWriteStream(dest);

                    response.on('data', chunk => {
                        transferred += chunk.length;
                        if (total > 0) onProgress(transferred, total);
                    });
                    // `pipe` does not forward source-stream errors, so a mid-stream transport error
                    // would otherwise be unhandled (hang / crash); handle it and drop the partial.
                    response.on('error', error => fail(error, fileStream));
                    response.pipe(fileStream);
                    fileStream.on('finish', () => fileStream.close(() => resolve()));
                    fileStream.on('error', error => fail(error, fileStream));
                })
                .on('error', reject);
        };
        request(url, 0);
    });

const sha256 = (filePath: string) =>
    new Promise<string>((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);
        stream.on('data', data => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });

const extractArchive = (archivePath: string, destDir: string) =>
    new Promise<void>((resolve, reject) => {
        // `tar` ships with macOS, Linux and Windows 10+; it handles both .tar.bz2 and .zip.
        const child = spawn('tar', ['-xf', archivePath, '-C', destDir], {
            stdio: ['ignore', 'ignore', 'pipe'],
        });
        let stderr = '';
        child.stderr?.on('data', data => {
            stderr += data.toString();
        });
        child.on('error', reject);
        child.on('close', code =>
            code === 0
                ? resolve()
                : reject(
                      new Error(
                          `Extraction failed (code ${code})${stderr ? `: ${stderr.trim()}` : ''}`,
                      ),
                  ),
        );
    });

// monerod is nested in a versioned directory inside the archive; flatten it into binDir.
const flattenBinary = (extractDir: string, binDir: string) => {
    const binaryName = getMonerodBinaryName();
    const stack = [extractDir];
    while (stack.length) {
        const dir = stack.pop()!;
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                stack.push(full);
            } else if (entry.name === binaryName) {
                fs.copyFileSync(full, getMonerodBinaryPath(binDir));
                if (process.platform !== 'win32') {
                    fs.chmodSync(getMonerodBinaryPath(binDir), 0o755);
                }

                return true;
            }
        }
    }

    return false;
};

/**
 * Downloads, verifies and extracts the monerod binary into `binDir`.
 * Resolves with the absolute path to the extracted binary.
 */
export const downloadMonerod = async ({
    binDir,
    onProgress,
}: {
    binDir: string;
    onProgress: DownloadProgress;
}): Promise<string> => {
    const { logger } = global;
    fs.mkdirSync(binDir, { recursive: true });

    const platformKey = getPlatformKey();
    const archiveName = getArchiveName(platformKey);
    const archivePath = path.join(binDir, archiveName);
    const url = `${DOWNLOAD_BASE}/${archiveName}`;

    logger.info('monerod', `Downloading ${url}`);
    await downloadFile(url, archivePath, onProgress);

    const expectedHash = ARCHIVE_SHA256[platformKey];
    if (!expectedHash) {
        // The binary is spawned as a child process, so never run an unverified download.
        fs.rmSync(archivePath, { force: true });
        throw new Error(
            `No pinned SHA-256 for ${platformKey}; refusing to use unverified monerod binary`,
        );
    }
    const actualHash = await sha256(archivePath);
    if (actualHash !== expectedHash) {
        fs.rmSync(archivePath, { force: true });
        throw new Error(`monerod checksum mismatch (expected ${expectedHash}, got ${actualHash})`);
    }

    const extractDir = path.join(binDir, 'extract');
    fs.mkdirSync(extractDir, { recursive: true });
    await extractArchive(archivePath, extractDir);

    if (!flattenBinary(extractDir, binDir)) {
        throw new Error('monerod binary not found in downloaded archive');
    }

    fs.rmSync(archivePath, { force: true });
    fs.rmSync(extractDir, { recursive: true, force: true });

    return getMonerodBinaryPath(binDir);
};
