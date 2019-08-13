import reducer from '@suite-reducers/firmwareReducer';

// imho it does not make much sense to test reducers. Maybe if there is
// some complex logic inside them, but I d say they are properly tested by testing actions.
describe('firmware reducer', () => {
    it('should return the initial state', () => {
        expect(reducer(undefined, {})).toEqual({
            status: null,
        });
    });
});
