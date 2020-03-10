import { formatCoinBalance } from '../balanceUtils';

test('formatBalanceUtils', () => {
    expect(formatCoinBalance('0')).toEqual('0');
    expect(formatCoinBalance('0.000000000000000000000000001')).toEqual('0.0000000');
    expect(formatCoinBalance('0.000000000000001')).toEqual('0.0000000');
    expect(formatCoinBalance('0.0001')).toEqual('0.0001000');
    expect(formatCoinBalance('0.1')).toEqual('0.1000000');
    expect(formatCoinBalance('1')).toEqual('1');
    expect(formatCoinBalance('666.666')).toEqual('666.66600');
    expect(formatCoinBalance('999')).toEqual('999');
    expect(formatCoinBalance('999.01')).toEqual('999.01000');
    expect(formatCoinBalance('1000')).toEqual('1000');
    expect(formatCoinBalance('1000.0001')).toEqual('1000.0001');
    expect(formatCoinBalance('1000.000000001')).toEqual('1000.0000');
    expect(formatCoinBalance('2600.1')).toEqual('2600.1000');
    expect(formatCoinBalance('200000')).toEqual('200000');
    expect(formatCoinBalance('2000000')).toEqual('2000000');
    expect(formatCoinBalance('2900000')).toEqual('2900000');
    expect(formatCoinBalance('100000001')).toEqual('100M+');
});
