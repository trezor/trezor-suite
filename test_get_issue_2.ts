import { BigNumber } from 'bignumber.js';

function twosComplement(number: BigNumber, bytes: number) {
    if (bytes < 1 || bytes > 32) {
        throw new Error('Int byte size must be between 1 and 32 (8 and 256 bits)');
    }
    const minValue = new BigNumber(2).exponentiatedBy(bytes * 8 - 1).negated();
    const maxValue = minValue.negated().minus(1);
    const bigNumber = new BigNumber(number);

    if (bigNumber.isGreaterThan(maxValue) || bigNumber.isLessThan(minValue)) {
        throw new Error(`Overflow when trying to convert number ${number} into ${bytes} bytes`);
    }

    if (bigNumber.isPositive()) {
        return bigNumber;
    }
    return bigNumber.minus(minValue).minus(minValue);
}

function intToHex(number, bytes, signed) {
    let bigNumber = new BigNumber(number);
    if (signed) {
        bigNumber = twosComplement(bigNumber, bytes);
    }
    if (bigNumber.isNegative()) {
        throw new Error(`Cannot convert negative number to unsigned interger: ${number}`);
    }
    const hex = bigNumber.toString(16);
    const hexChars = bytes * 2;
    if (hex.length > hexChars) {
        throw new Error(`Overflow when trying to convert number ${number} into ${bytes} bytes`);
    }

    return hex.padStart(bytes * 2, '0');
}

export function encodeData(typeName: string, data: any) {
    const paramTypeNumber = new RegExp(/^(u?int)([0-9]*)$/);
    const numberMatch = paramTypeNumber.exec(typeName);
    if (numberMatch) {
        const [_, intType, bits] = numberMatch;
        const bytes = Math.ceil(parseInt(bits, 10) / 8);

        return intToHex(data, bytes, intType === 'int');
    }
}

try {
  console.log(encodeData("uint256", "115792089237316195423570985008687907853269984665640564039457584007913129639935"));
} catch(e) {
  console.log(e);
}
