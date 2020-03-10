import { formatCoinBalance } from '../balanceUtils';

test('formatBalanceUtils', () => {
    expect(formatCoinBalance('0')).toEqual('0');
    expect(formatCoinBalance('0.000000000000000000000000001')).toEqual('~0');
    expect(formatCoinBalance('0.000000000000001')).toEqual('~0');
    expect(formatCoinBalance('0.0001')).toEqual('0,0001000');
    expect(formatCoinBalance('0.1')).toEqual('0,1000000');
    expect(formatCoinBalance('1')).toEqual('1,0000000');
    expect(formatCoinBalance('999')).toEqual('999,00000');
    expect(formatCoinBalance('666.666')).toEqual('666,66600');
    expect(formatCoinBalance('1000')).toEqual('1K');
    expect(formatCoinBalance('1200')).toEqual('1,2K');
    expect(formatCoinBalance('1200.0001')).toEqual('1,2K');
    expect(formatCoinBalance('2600.0001')).toEqual('2,6K');
    expect(formatCoinBalance('200000')).toEqual('200K');
    expect(formatCoinBalance('2000000')).toEqual('2M');
    expect(formatCoinBalance('2900000')).toEqual('2,9M');
});
