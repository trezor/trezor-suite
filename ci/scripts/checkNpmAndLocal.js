const { execSync } = require('child_process');

const fs = require('fs');
const util = require('util');
const https = require('https');
const fetch = require('cross-fetch');
const tar = require('tar');
const path = require('path');
const crypto = require('crypto');

const mkdir = util.promisify(fs.mkdir);
const existsDirectory = util.promisify(fs.exists);

const makeSureDirExists = async dirPath => {
    if (!(await existsDirectory(dirPath))) {
        // Make sure there is dirPath directory.
        return mkdir(dirPath, { recursive: true });
    }
};

async function extractTarball(tarballPath, extractPath) {
    try {
        await makeSureDirExists(extractPath);
        await tar.x({ file: tarballPath, C: extractPath });
        return extractPath;
    } catch (error) {
        console.error('Error:', error);
    }
}

const downloadFile = (url, filePath) =>
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

                // Pipe the response stream to the file stream
                stream.pipe(file);

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

const packModule = (modulePath, outputDirectory) => {
    try {
        const currentPwd = __dirname;
        // Change the current working directory
        process.chdir(outputDirectory);

        // Run npm pack
        const result = execSync(`npm pack ${modulePath}`, { encoding: 'utf8' });

        process.chdir(currentPwd);
        // Return the path to the tarball
        return path.join(outputDirectory, result.trim());
    } catch (error) {
        console.error('Error during npm pack:', error);
    }
};

const calculateChecksumForFile = filePath => {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
};

const calculateChecksum = directoryPath => {
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

const getLocalAndRemoteChecksums = async moduleName => {
    const ROOT = path.join(__dirname, '..', '..');

    const [_prefix, name] = moduleName.split('/');
    const PACKAGE_PATH = path.join(ROOT, 'packages', name);
    const tmpDir = path.join(__dirname, 'tmp');
    const npmRegistryUrl = `https://registry.npmjs.org/${moduleName}`;

    try {
        console.log(`fetching npm registry info from: ${npmRegistryUrl}`);
        const response = await fetch(npmRegistryUrl);
        const data = await response.json();
        if (data.error) {
            return { success: false };
        }
        const latestVersion = data['dist-tags'].latest;
        console.log(`latest remote version in npm registry: ${latestVersion}`);
        const tarballUrl = data.versions[latestVersion].dist.tarball;

        const tarballDestination = path.join(__dirname, 'tmp', name);
        console.log(`downloading tarball from ${tarballUrl} to `);
        const fileName = await downloadFile(tarballUrl, tarballDestination);
        console.log(`File downloaded!: ${fileName}`);

        const extractRemotePath = path.join(__dirname, 'tmp', 'remote', name);
        await extractTarball(tarballDestination, extractRemotePath);

        const tarballPath = packModule(PACKAGE_PATH, tmpDir);

        const extractLocalPath = path.join(__dirname, 'tmp', 'local', name);

        await extractTarball(tarballPath, extractLocalPath);

        const remoteChecksum = calculateChecksum(`${extractRemotePath}/package/lib`);

        const localChecksum = calculateChecksum(`${extractLocalPath}/package/lib`);

        return { success: true, data: { localChecksum, remoteChecksum } };
    } catch (error) {
        console.error('error', error);
    }
};

module.exports = {
    getLocalAndRemoteChecksums,
};
