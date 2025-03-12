import fs from 'fs';
import path from 'path';
import prettier from 'prettier';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

(async () => {
    const { argv } = yargs(hideBin(process.argv)).boolean('test') as any;
    const isTesting = argv.test || false;

    const serializeConfig = async (config: any, stringifySpaces?: number) => {
        try {
            return await prettier.format(
                `const palette = ${JSON.stringify(config, null, stringifySpaces)};\n\nexport default palette;`,
                { parser: 'babel' },
            );
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    };

    const normalizeName = (name: string) =>
        name
            .replace(/(-1)/g, 'Negative')
            .replace(/-/g, ' ')
            .replace(/\//g, ' ')
            .replace(/[^a-zA-Z0-9 ]/g, '')
            .split(' ')
            .map((word, index) =>
                index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1),
            )
            .join('');

    const parseJSONFile = (filePath: string) => {
        try {
            return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : null;
        } catch (error) {
            console.error(`Error parsing JSON file: ${filePath}`, error);
            process.exit(1);
        }
    };

    const jsonData = parseJSONFile(path.resolve(process.cwd(), 'input.json'));
    if (!jsonData) {
        console.error('No valid JSON data found.');
        process.exit(1);
    }

    const palette: Record<string, string> = {};
    jsonData.collections.forEach((collection: any) => {
        collection.modes.forEach((mode: any) => {
            mode.variables.forEach((variable: any) => {
                const key = normalizeName(variable.name);
                palette[key] = variable.value;
            });
        });
    });

    const formattedOutput = await serializeConfig(palette, 2);

    fs.writeFileSync('palette.js', formattedOutput);

    if (isTesting) {
        console.log('Palette generated:', palette);
    }
})();
