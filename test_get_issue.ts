// Wait, I saw it before.
// In `test_find_cause_5.ts`:
// `new BigNumber("115792089237316195423570985008687907853269984665640564039457584007913129639935")`
// returns a BigNumber object.
// Its length is 64 when converted to hex.
// So `hex.length > hexChars` where `hexChars = 32 * 2 = 64`.
// `64 > 64` is FALSE. So NO overflow error.
// THEN WHAT IS THE ISSUE?
// Let's trace `encodeData("uint256", "115792089237316195423570985008687907853269984665640564039457584007913129639935")` inside Node.js again.
import { encodeData } from './packages/connect/src/api/ethereum/ethereumSignTypedData';
console.log(encodeData("uint256", "115792089237316195423570985008687907853269984665640564039457584007913129639935"));
