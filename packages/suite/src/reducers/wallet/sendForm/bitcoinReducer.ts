export interface State {
    test: string;
}

export const initialState: State = {
    test: 'aha',
};

export default (state: State = initialState): State => {
    switch ('test') {
        case 'test':
            return (test = 'aha');

        default:
            return state;
    }
};
