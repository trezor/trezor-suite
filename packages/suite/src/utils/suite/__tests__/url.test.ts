import { getPrettyUrl } from '../url';

const fixtures = [
    {
        input: 'www.bla.bla',
        output: 'www.bla.bla',
    },
    {
        input: 'https://foo.bar',
        output: 'foo.bar',
    },
    {
        input: 'http://foo.bar',
        output: 'foo.bar',
    },
    {
        input: 'https://www.bar.foo/todotodo/boo/',
        output: 'www.bar.foo',
    },
];

describe('getPrettyUrl', () => {
    fixtures.forEach(f => {
        it(`${f.input} => ${f.output}`, () => {
            expect(getPrettyUrl(f.input)).toEqual(f.output);
        });
    });
});
