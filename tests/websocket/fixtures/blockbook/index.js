/* eslint-disable global-require */
// mocked blockbook responses

export default {
    getInfo: require('./getInfo'),
    getAccountInfo: require('./getAccountInfo'),
    subscribe: require('./estimateFee'),
};
