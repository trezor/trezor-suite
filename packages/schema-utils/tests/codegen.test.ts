import { generateForFile } from '../src/codegen';

describe('codegen', () => {
    it('should generate code for protobuf messages example', () => {
        const output = generateForFile(`${__dirname}/__snapshots__/codegen.input.ts`);
        expect(output).toMatchSnapshot();
    });
});
