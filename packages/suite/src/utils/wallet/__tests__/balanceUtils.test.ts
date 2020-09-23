import { formatCoinBalance } from '../balanceUtils';

test('formatBalanceUtils', () => {
    // @ts-ignore
    expect(formatCoinBalance(undefined)).toEqual('0');
    expect(formatCoinBalance('ssssstring')).toEqual('0');
    expect(formatCoinBalance('0')).toEqual('0');
    expect(formatCoinBalance('0.000000000000000000000000001')).toEqual('0.00');
    expect(formatCoinBalance('0.000000000000001')).toEqual('0.00');
    expect(formatCoinBalance('0.0001')).toEqual('0.0001');
    expect(formatCoinBalance('0.1')).toEqual('0.1');
    expect(formatCoinBalance('1')).toEqual('1');
    expect(formatCoinBalance('666.666')).toEqual('666.666');
    expect(formatCoinBalance('999')).toEqual('999');
    expect(formatCoinBalance('999.01')).toEqual('999.01');
    expect(formatCoinBalance('1000')).toEqual('1000');
    expect(formatCoinBalance('1000.0001')).toEqual('1000.0001');
    expect(formatCoinBalance('1000.000000001')).toEqual('1000.00');
    expect(formatCoinBalance('2600.1')).toEqual('2600.1');
    expect(formatCoinBalance('200000')).toEqual('200000');
    expect(formatCoinBalance('2000000')).toEqual('2000000');
    expect(formatCoinBalance('2900000')).toEqual('2900000');
    expect(formatCoinBalance('100000000')).toEqual('100m');
    expect(formatCoinBalance('100000001')).toEqual('100m+');
    expect(formatCoinBalance('0099999999.999999999999')).toEqual('99999999.9…');
    expect(formatCoinBalance('0.12345678')).toEqual('0.12345678');
    expect(formatCoinBalance('10.12345678')).toEqual('10.1234567…');
});
