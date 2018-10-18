/* @flow */
import path from 'path';

export const ABSOLUTE_BASE: string = path.normalize(path.join(__dirname, '..'));

const constants: Object = Object.freeze({
    BUILD: path.join(ABSOLUTE_BASE, 'build/'),
    SRC: path.join(ABSOLUTE_BASE, 'src/'),
    PORT: 8089,
    INDEX: path.join(ABSOLUTE_BASE, 'src/index.html'),
});

export const {
    BUILD,
    SRC,
    PORT,
    INDEX,
}: { BUILD: string, SRC: string, PORT: string, INDEX: string } = constants;