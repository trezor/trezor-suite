import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// unimportant for the script
// eslint-disable-next-line
import oldMenu from '@trezor/connect-explorer/src/data/menu';

function firstLetterToUpperCase(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function findNameInMenu(url: string) {
    let found = null;
    oldMenu.forEach(section => {
        section.children.forEach(method => {
            if (method.url === url) {
                found = method.name;
            }
            if (method.children) {
                method.children.forEach(subMethod => {
                    if (subMethod.url === url) {
                        found = subMethod.name;
                    }
                });
            }
        });
    });

    if (!found) {
        console.error('Method not found in the menu:', url);

        return null;
    }

    return firstLetterToUpperCase(found);
}

function findFilesForMethod(method: string) {
    const output: any[] = [];

    const filesData = fs.readdirSync(
        path.join(__dirname, '../../connect-explorer/src/data/methods'),
    );
    filesData.forEach(dir => {
        if (dir.includes('.')) return;
        const methods = fs.readdirSync(
            path.join(__dirname, `../../connect-explorer/src/data/methods/${dir}`),
        );
        methods.forEach(file => {
            if (!file.endsWith('.ts')) return;
            const content = fs.readFileSync(
                path.join(__dirname, `../../connect-explorer/src/data/methods/${dir}/${file}`),
                'utf-8',
            );
            if (content.includes(`name = '${method}'`) || content.includes(`name: '${method}'`)) {
                console.log(content);
                const methods = [...content.matchAll(/url: '(.*)'/g)].map((match, i) => ({
                    url: match[1],
                    title: findNameInMenu(match[1]),
                    dir,
                    file,
                    cleanfile: file.replace('.ts', '').replace(/\./g, '_').replace(/\-/g, '_'),
                    i,
                }));
                output.push(...methods);
            }
        });
    });

    return output;
}

function handleMethod(filePath: string) {
    const content = fs.readFileSync(
        path.join(__dirname, `../src/pages/methods/${filePath}`),
        'utf-8',
    );
    if (!content.includes('ApiPlayground') || content.includes('No payload')) return;

    const method = content.match(/method: '(.*)'/)?.[1];
    console.log(filePath, method);

    if (!method) return;

    const relevantFiles = findFilesForMethod(method);

    const newImports = new Set(
        relevantFiles.map(
            file =>
                `import ${file.cleanfile} from '../../../data/methods/${file.dir}/${file.file}';`,
        ),
    );
    const newImportsStr = [...newImports].join('\n');
    console.log(newImportsStr);
    const newOptions = relevantFiles
        .map(
            file =>
                `\n        { title: '${file.title}', legacyConfig: ${file.cleanfile}[${file.i}] },`,
        )
        .join('');
    console.log(newOptions);
    console.log(content.match(/options\=\{\[/gi));

    let newContent = content
        .replace(/options\=\{\[/gi, 'options={[' + newOptions)
        .replace(/\<ApiPlayground/gi, newImportsStr + '\n\n<ApiPlayground')
        .replace(/title: 'Bundle\(([^\)]*)\)',\s+method:/gi, 'title: "Advanced bundle", method:')
        .replace(/title: '([^']*)',\s+method:/gi, "title: 'Advanced schema', method:");
    console.log(newContent);

    const outputPath = path.join(__dirname, `../src/pages/methods/${filePath}`);
    fs.writeFileSync(outputPath, newContent);

    // Format the file and check with eslint
    try {
        execSync(`yarn g:eslint --fix ${outputPath}`);
        execSync(`yarn g:prettier --write ${outputPath}`);
    } catch (error) {
        console.error('Error while formatting the file:', error.message);
        console.error(error.output?.[1]?.toString());
    }
}

function convertAll() {
    const methodTypes = fs.readdirSync(path.join(__dirname, '../src/pages/methods'));

    methodTypes.forEach(methodType => {
        const files = fs.readdirSync(path.join(__dirname, `../src/pages/methods/${methodType}`));
        files.forEach(file => {
            if (!file.endsWith('.mdx')) return;
            handleMethod(path.join(methodType, file));
        });
    });
}

const arg = process.argv[2];
if (arg === '--all') {
    convertAll();
} else {
    handleMethod(arg);
}
