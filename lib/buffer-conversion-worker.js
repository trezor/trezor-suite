/* @flow */

// eslint-disable-next-line no-undef
onmessage = function (event: {data: string}) {
    try {
        const res = new Buffer(event.data, 'hex');

        // $FlowIssue
        postMessage({type: 'result', buffer: res});
    } catch (e) {
        console.log(e);
        // $FlowIssue
        postMessage({type: 'error', text: (e.message || e)});
    }
};
