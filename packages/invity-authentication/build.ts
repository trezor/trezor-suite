import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

interface PageAssetCollection {
    [key: string]: {
        js?: string[];
        css?: string[];
    };
}

interface AssetHashes {
    scripts: string[];
    styles: string[];
}

const SourcePath = path.join(__dirname, 'src');
const BuildPath = path.join(__dirname, 'build');

const HtmlPath = path.join(SourcePath, 'html');
const ScriptsPath = path.join(SourcePath, 'js');
const StylesPath = path.join(SourcePath, 'css');

const getScriptFilePath = (fileName: string) => path.join(ScriptsPath, fileName);
const getStyleFilePath = (fileName: string) => path.join(StylesPath, fileName);

const pageAssetCollection: PageAssetCollection = {
    login: {
        js: [getScriptFilePath('flow.js'), getScriptFilePath('login.js')],
        css: [getStyleFilePath('login.css')],
    },
    registration: {
        js: [getScriptFilePath('flow.js'), getScriptFilePath('registration.js')],
        css: [getStyleFilePath('registration.css')],
    },
    'login-success': {
        js: [getScriptFilePath('login-success.js')],
    },
    'registration-success': {
        js: [getScriptFilePath('registration-success.js')],
    },
};

const ScriptPlaceholder = /<!-- ScriptPlaceholder -->/g;
const StylePlaceholder = /<!-- StylePlaceholder -->/g;

// create build folder
fs.mkdirSync(BuildPath);

const AssetHashesBuildFilePath = path.join(BuildPath, 'asset-hashes.json');
const hashAlgorithm = 'sha256';
const assetHashes: AssetHashes = {
    scripts: [],
    styles: [],
};

function getScriptTag(scriptPath: string, assetHashes: AssetHashes) {
    const scriptContent = fs.readFileSync(scriptPath).toString();
    const hash = crypto.createHash(hashAlgorithm);
    const hashValue = `${hashAlgorithm}-${hash.update(scriptContent).digest('base64')}`;
    if (assetHashes.scripts.indexOf(hashValue) === -1) {
        assetHashes.scripts.push(hashValue);
    }
    return `<script type="text/javascript" defer>${scriptContent}</script>`;
}

function getStyleTag(stylePath: string, assetHashes: AssetHashes) {
    const styleContent = fs.readFileSync(stylePath).toString();
    const hash = crypto.createHash(hashAlgorithm);
    const hashValue = `${hashAlgorithm}-${hash.update(styleContent).digest('base64')}`;
    if (!assetHashes.styles.includes(hashValue)) {
        assetHashes.styles.push(hashValue);
    }
    return `<style>${styleContent}</style>`;
}

// Replace placeholder for scripts and styles in HTML templates and save to build folder.
Object.entries(pageAssetCollection).forEach(([page, assets]) => {
    const htmlFileName = `${page}.html`;
    const htmlFilePath = path.join(HtmlPath, htmlFileName);

    let data: string;
    try {
        data = fs.readFileSync(htmlFilePath, 'utf8');
    } catch (error) {
        console.error(error);
        return;
    }

    let result = data;
    if (assets.js) {
        const scriptTags = assets.js.map(scriptPath => getScriptTag(scriptPath, assetHashes));
        result = result.replace(ScriptPlaceholder, scriptTags.join(''));
    }
    if (assets.css) {
        const styleTags = assets.css.map(stylePath => getStyleTag(stylePath, assetHashes));
        result = result.replace(StylePlaceholder, styleTags.join(''));
    }

    const buildFilePath = path.join(BuildPath, htmlFileName);
    fs.writeFile(buildFilePath, result, error => {
        if (error) {
            console.log(error);
        }
    });
});

// Create file with assets' hashes to include theme in CSP for Suite Desktop.
fs.writeFileSync(AssetHashesBuildFilePath, JSON.stringify(assetHashes));
