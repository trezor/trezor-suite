import * as LOG from 'actions/constants/log';

export const toggle = () => (dispatch, getState) => {
    if (!getState().log.opened) {
        window.scrollTo(0, 0);

        dispatch({
            type: LOG.OPEN,
        });
    } else {
        dispatch({
            type: LOG.CLOSE,
        });
    }
};

export const add = (type, message) => ({
    type: LOG.ADD,
    payload: {
        time: new Date().getTime(),
        type,
        message,
    },
});
