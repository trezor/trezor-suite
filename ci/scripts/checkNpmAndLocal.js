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

const packModule = (moduleName, modulePath, outputDirectory) => {
    try {
        const currentPwd = __dirname;
        // Change the current working directory
        process.chdir(modulePath);

        // Run npm pack
        const fileName = `${moduleName}.tgz`;
        const result = execSync(`yarn pack -o ${outputDirectory}/${fileName}`, {
            encoding: 'utf8',
        });

        process.chdir(currentPwd);
        // Return the path to the tarball
        return path.join(outputDirectory, fileName);
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
        console.log(`extracting remote tarball from ${tarballDestination} to ${extractRemotePath}`);
        await extractTarball(tarballDestination, extractRemotePath);

        console.log(`packaging local npm module from ${PACKAGE_PATH} to ${tmpDir}`);
        const tarballPath = packModule(name, PACKAGE_PATH, tmpDir);

        const extractLocalPath = path.join(__dirname, 'tmp', 'local', name);

        console.log(`extracting local tarball  from ${tarballPath} to ${extractLocalPath}`);
        await extractTarball(tarballPath, extractLocalPath);

        console.log('calculating remote package checksum');
        const remoteChecksum = calculateChecksum(`${extractRemotePath}/package`);
        console.log('remoteChecksum', remoteChecksum);

        console.log('calculating local package checksum');
        const localChecksum = calculateChecksum(`${extractLocalPath}/package`);
        console.log('localChecksum', localChecksum);

        return { success: true, data: { localChecksum, remoteChecksum } };
    } catch (error) {
        console.error('error getting local and remote checksums:', error);
        return { success: false, error };
    }
};

module.exports = {
    getLocalAndRemoteChecksums,
};
