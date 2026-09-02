const LOCAL_A = 'wss://localhost/a.onion';
const LOCAL_B = 'localhost:50001:t';
const LOCAL_C = '127.0.0.1:333/url';
const ONION_A = 'abcd-efg.oNiOn:50002:s';
const ONION_B = 'http://a.b.onion/localhost';
const ONION_C = 'localhost.onion:1234';
const OTHER_A = 'ws://LOCALHOST.onion.cz/onion?a=1';
const OTHER_B = 'ABcd.efgh.ij:4444:s';
const OTHER_C = 'https://a/localhost';

export const endpoints = {
    unsorted: [ONION_B, OTHER_B, LOCAL_B, ONION_A, OTHER_C, LOCAL_A, ONION_C, OTHER_A, LOCAL_C],
    sorted: [LOCAL_C, LOCAL_B, LOCAL_A, ONION_A, ONION_B, ONION_C, OTHER_B, OTHER_C, OTHER_A],
};
