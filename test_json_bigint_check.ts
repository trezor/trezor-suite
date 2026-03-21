import JSONbig from 'json-bigint';

const dataStr = '{"message": {"value": 115792089237316195423570985008687907853269984665640564039457584007913129639935, "nonce": 0}}';

// json-bigint returns a BigNumber object (from bignumber.js if configured or its own internal BigNumber).
// With { storeAsString: true } it returns strings!
const jsonBig = JSONbig({ storeAsString: true });
const parsed = jsonBig.parse(dataStr);

console.log(parsed.message.value);
console.log(typeof parsed.message.value);

// Let's check how it serializes back.
console.log(jsonBig.stringify(parsed));
