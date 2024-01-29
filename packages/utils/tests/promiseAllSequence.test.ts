import { promiseAllSequence } from '../src/promiseAllSequence';

describe('promiseAllSequence', () => {
    it('all passed', async () => {
        const actionInnerProcess = jest.fn();

        const action = (id: number, time: number) =>
            new Promise(resolve => {
                setTimeout(() => {
                    actionInnerProcess(id);
                    resolve(id);
                }, time);
            });

        const actions = [() => action(1, 500), () => action(2, 300), () => action(3, 100)];

        const result = await promiseAllSequence(actions);
        expect(result).toEqual([1, 2, 3]);
        const args = actionInnerProcess.mock.calls.slice(0, 3);
        expect(args).toEqual([[1], [2], [3]]);

        // comparison with Promise.all
        const promiseAll = await Promise.all(actions.map(a => a()));
        expect(promiseAll).toEqual([1, 2, 3]); // results are the same
        const args2 = actionInnerProcess.mock.calls.slice(3);
        expect(args2).toEqual([[3], [2], [1]]); // but actionInnerProcess was called in different order
    });

    it('one failed', async () => {
        const action = (id: number, time: number) =>
            new Promise((resolve, reject) => {
                setTimeout(() => {
                    if (id === 2) {
                        reject(new Error('Foo'));
                    } else {
                        resolve(id);
                    }
                }, time);
            });

        const actions = [() => action(1, 500), () => action(2, 300), () => action(3, 100)];

        await expect(promiseAllSequence(actions)).rejects.toThrow('Foo');
    });
});
