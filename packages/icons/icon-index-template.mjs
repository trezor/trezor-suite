import path from 'node:path';

import { getIconExportName } from './getIconExportName.mjs';

function indexTemplate(filePaths) {
    const exportEntries = filePaths.map(({ path: filePath }) => {
        const basename = path.basename(filePath, path.extname(filePath));
        const exportName = getIconExportName(filePath);

        return `export { ReactComponent as ${exportName} } from './${basename}'`;
    });

    return exportEntries.join('\n');
}

export default indexTemplate;
