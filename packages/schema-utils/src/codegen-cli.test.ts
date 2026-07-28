import { execFileSync } from 'node:child_process';
import path from 'node:path';

const codegenScript = path.resolve(__dirname, 'codegen.ts');
const tsxCli = require.resolve('tsx/cli');
const fixture = path.resolve(__dirname, '__fixtures__/codegen-cli.fixture.ts');

const runCli = (args: string[]) =>
    execFileSync(process.execPath, [tsxCli, codegenScript, ...args], {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
    });

describe('codegen CLI entry point', () => {
    it('generates TypeBox schemas from a TypeScript fixture', () => {
        const output = runCli([fixture]);

        expect(output).toContain("import { Type, Static } from '@trezor/schema-utils';");
        expect(output).toContain('export enum Color { Red = 1, Green = 2, Blue = 3 }');
        expect(output).toContain('export const EnumColor = Type.Enum(Color)');
        expect(output).toContain('export const User = Type.Object({');
        expect(output).toContain('favoriteColor: EnumColor');
        expect(output).toContain('tags: Type.Optional(Type.Array(Type.String()))');
        expect(output).toContain('export const UserList = Type.Array(User');
    });

    it('throws when the input file does not exist', () => {
        expect(() => runCli(['/nonexistent/file.ts'])).toThrow(/File not found/);
    });
});
