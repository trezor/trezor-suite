import { execSync } from 'child_process';

import fs from 'fs';
import util from 'util';
import fetch from 'cross-fetch';
import path from 'path';
import * as tar from 'tar';
import crypto from 'crypto';
import semver from 'semver';

const mkdir = util.promisify(fs.mkdir);
const existsDirectory = util.promisify(fs.exists);

const makeSureDirExists = async (dirPath: string) => {
    if (!(await existsDirectory(dirPath))) {
        // Make sure there is dirPath directory.
        return mkdir(dirPath, { recursive: true });
    }
};

async function extractTarball(tarballPath: string, extractPath: string) {
    try {
        await makeSureDirExists(extractPath);
        await tar.x({ file: tarballPath, C: extractPath });
        return extractPath;
    } catch (error) {
        console.error('Error:', error);
    }
}

const downloadFile = (url: string, filePath: string) =>
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

const packModule = (moduleName: string, modulePath: string, outputDirectory: string) => {
    try {
        const currentPwd = __dirname;
        // Change the current working directory
        process.chdir(modulePath);

        // Run npm pack
        const fileName = `${moduleName}.tgz`;
        execSync(`yarn pack -o ${outputDirectory}/${fileName}`, {
            encoding: 'utf8',
        });

        process.chdir(currentPwd);
        // Return the path to the tarball
        return path.join(outputDirectory, fileName);
    } catch (error) {
        console.error('Error during npm pack:', error);
    }
};

const calculateChecksumForFile = (filePath: string) => {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
};

const calculateChecksum = (directoryPath: string) => {
    const combinedHash = crypto.createHash('sha256');

    fs.readdirSync(directoryPath).forEach(file => {
        const filepath = path.join(directoryPath, file);
        if (fs.statSync(filepath).isDirectory()) {
            combinedHash.update(calculateChecksum(filepath));
        } else {
            combinedHash.update(calculateChecksumForFile(filepath));
        }
    });

    return combinedHash.digest('hex');
};

export const getLocalAndRemoteChecksums = async (
    moduleName: string,
): Promise<
    | {
          success: true;
          data: {
              localChecksum: string;
              remoteChecksum: string;
              distributionTags: {
                  beta: string;
                  latest: string;
              };
          };
      }
    | { success: false; error: string }
> => {
    const ROOT = path.join(__dirname, '..', '..');

    const [_prefix, name] = moduleName.split('/');
    const PACKAGE_PATH = path.join(ROOT, 'packages', name);
    const tmpDir = path.join(__dirname, 'tmp');
    const npmRegistryUrl = `https://registry.npmjs.org/${moduleName}`;

    try {
        console.info(`fetching npm registry info from: ${npmRegistryUrl}`);
        const response = await fetch(npmRegistryUrl);
        const data = await response.json();
        if (data.error) {
            return { success: false, error: 'Error fetching from npm registry' };
        }

        const betaVersion = data['dist-tags'].beta;
        console.info(`beta remote version in npm registry: ${betaVersion}`);
        const latestVersion = data['dist-tags'].latest;
        console.info(`latest remote version in npm registry: ${latestVersion}`);

        // When beta version has greatest semver in NPM then we need to check with
        // that one since that was released latest in time, so it includes oldest changes.
        const greatestSemver =
            betaVersion && semver.gt(betaVersion, latestVersion) ? betaVersion : latestVersion;

        console.info(`greatest remove version in npm registry: ${greatestSemver}`);

        const tarballUrl = data.versions[greatestSemver].dist.tarball;

        const tarballDestination = path.join(__dirname, 'tmp', name);
        console.info(`downloading tarball from ${tarballUrl} to `);
        const fileName = await downloadFile(tarballUrl, tarballDestination);
        console.info(`File downloaded!: ${fileName}`);

        const extractRemotePath = path.join(__dirname, 'tmp', 'remote', name);
        console.info(
            `extracting remote tarball from ${tarballDestination} to ${extractRemotePath}`,
        );
        await extractTarball(tarballDestination, extractRemotePath);

        console.info(`packaging local npm module from ${PACKAGE_PATH} to ${tmpDir}`);
        const tarballPath = packModule(name, PACKAGE_PATH, tmpDir);
        if (!tarballPath) {
            return { success: false, error: 'Error packing module tarball' };
        }

        const extractLocalPath = path.join(__dirname, 'tmp', 'local', name);

        console.info(`extracting local tarball  from ${tarballPath} to ${extractLocalPath}`);
        await extractTarball(tarballPath, extractLocalPath);

        console.info('calculating remote package checksum');
        const remoteChecksum = calculateChecksum(`${extractRemotePath}/package`);
        console.info('remoteChecksum', remoteChecksum);

        console.info('calculating local package checksum');
        const localChecksum = calculateChecksum(`${extractLocalPath}/package`);
        console.info('localChecksum', localChecksum);

        return {
            success: true,
            data: { localChecksum, remoteChecksum, distributionTags: data['dist-tags'] },
        };
    } catch (error) {
        console.error('error getting local and remote checksums:', error);
        return { success: false, error };
    }
};
