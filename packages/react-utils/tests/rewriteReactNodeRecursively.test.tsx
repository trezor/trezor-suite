import { rewriteReactNodeRecursively } from '../src/rewriteReactNodeRecursively';

describe('rewriteReactNodeRecursively', () => {
    const callback = (stringSubNode: string) => stringSubNode.replace(/foo/g, 'bar');

    it('should rewrite a string subnode', () => {
        const inputNode = 'This is foobar.';
        const expectedNode = 'This is barbar.';
        expect(rewriteReactNodeRecursively(inputNode, callback)).toBe(expectedNode);
    });

    it('should cast a number subnode to string and rewrite it', () => {
        const callbackForNumbers = (stringifiedNumber: string) =>
            stringifiedNumber.replace(/34/g, '***');
        const inputNode = 123456;
        const expectedNode = '12***56';
        expect(rewriteReactNodeRecursively(inputNode, callbackForNumbers)).toBe(expectedNode);
    });

    it('should return the node if it is a primitive other than string or number', () => {
        expect(rewriteReactNodeRecursively(null, callback)).toBe(null);
        expect(rewriteReactNodeRecursively(undefined, callback)).toBe(undefined);
        expect(rewriteReactNodeRecursively(true, callback)).toBe(true);
    });

    it('should rewrite all string subnodes in an array', () => {
        const inputNode = ['This is foobar.', 'It has a foo.'];
        const expectedNode = ['This is barbar.', 'It has a bar.'];
        expect(rewriteReactNodeRecursively(inputNode, callback)).toEqual(expectedNode);
    });

    it('should recursively rewrite string subnodes in a ReactElement', () => {
        const inputNode = (
            <span>
                This is foobar, <i>it has a foo</i>.
            </span>
        );
        expect(rewriteReactNodeRecursively(inputNode, callback)).toMatchSnapshot();
    });

    it('should iterate through a collection of ReactNodes, preserving keys or setting them to index if necessary', () => {
        const inputNode = [
            // eslint-disable-next-line react/jsx-key
            <span>Foo does not have key!.</span>,
            <span key="id234">This is foo with key.</span>,
            false,
        ] as const;

        const result = rewriteReactNodeRecursively(inputNode, callback) as typeof inputNode;

        expect(result.length).toBe(3);
        expect(result[0].key).toBe('0');
        expect(result[1].key).toBe('id234');
    });
});
