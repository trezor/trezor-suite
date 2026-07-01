import path from 'path';

function indexTemplate(filePaths) {
    const exportEntries = filePaths.map(({ path: filePath }) => {
        const basename = path.basename(filePath, path.extname(filePath));
        const exportName = /^\d/.test(basename) ? `Svg${basename}` : basename;

        return `export { ReactComponent as ${exportName}Icon } from './${basename}'`;
    });

    return exportEntries.join('\n');
}

export default indexTemplate;
