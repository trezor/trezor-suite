import { addNamedSchemaFacades } from './addNamedSchemaFacades';

describe(addNamedSchemaFacades.name, () => {
    it('creates named façades for reusable and operation schemas', () => {
        const implementation = `
export const Yield = zod.object({ id: zod.string() });
export type Yield = zod.input<typeof Yield>;
export type YieldOutput = zod.output<typeof Yield>;

export const GetYieldParams = zod.object({ yieldId: zod.string() });
`;
        const result = addNamedSchemaFacades(implementation);

        expect(result).toContain('export interface YieldSchema');
        expect(result).toContain('extends zod.ZodType<YieldOutput, Yield> {}');
        expect(result).toContain('export const Yield: YieldSchema = yieldImplementation;');
        expect(result).toContain('export interface GetYieldParamsSchema');
        expect(result).toContain(
            'export type GetYieldParams = zod.input<typeof getYieldParamsImplementation>;',
        );
    });
});
