import { basename, extname } from 'node:path';

export const getIconExportName = filePath => {
    const iconName = basename(filePath, extname(filePath));
    const validIconName = /^\d/.test(iconName) ? `Svg${iconName}` : iconName;

    return `${validIconName}Icon`;
};
