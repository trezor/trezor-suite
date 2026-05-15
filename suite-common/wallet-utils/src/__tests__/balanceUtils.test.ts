import { formatCoinBalance, formatCoinBalanceByFiatRate } from '../balanceUtils';

test('formatBalanceUtils', () => {
    // @ts-expect-error
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
    expect(formatCoinBalance('1000')).toEqual('1,000');
    expect(formatCoinBalance('1000.0001')).toEqual('1,000.0001');
    expect(formatCoinBalance('1000.000000001')).toEqual('1,000.00');
    expect(formatCoinBalance('2600.1')).toEqual('2,600.1');
    expect(formatCoinBalance('200000')).toEqual('200,000');
    expect(formatCoinBalance('2000000')).toEqual('2,000,000');
    expect(formatCoinBalance('2900000')).toEqual('2,900,000');
    expect(formatCoinBalance('0099999999.999999999999')).toEqual('99,999,999.9…');
    expect(formatCoinBalance('0.12345678')).toEqual('0.12345678');
    expect(formatCoinBalance('10.12345678')).toEqual('10.1234567…');
    expect(formatCoinBalance('10000.123', 'cs-CZ')).toEqual('10\xa0000,123');
    expect(formatCoinBalance('10000.123', 'es-ES')).toEqual('10.000,123');
    expect(formatCoinBalance('10000.123', 'ru-RU')).toEqual('10\xa0000,123');
});

test('formatCoinBalanceByFiatRate', () => {
    // Zero / invalid inputs
    expect(formatCoinBalanceByFiatRate('0', 'en-US', 60000)).toEqual('0');
    expect(formatCoinBalanceByFiatRate('not-a-number', 'en-US', 60000)).toEqual('0');

    // Missing / invalid rate falls back to formatCoinBalance
    expect(formatCoinBalanceByFiatRate('1.23456789', 'en-US', undefined)).toEqual('1.23456789');
    expect(formatCoinBalanceByFiatRate('1.23456789', 'en-US', 0)).toEqual('1.23456789');
    expect(formatCoinBalanceByFiatRate('1.23456789', 'en-US', -5)).toEqual('1.23456789');

    // BTC @ $60k → 5 decimals
    expect(formatCoinBalanceByFiatRate('0.12345678', 'en-US', 60000)).toEqual('0.12345…');
    expect(formatCoinBalanceByFiatRate('1.5', 'en-US', 60000)).toEqual('1.5');

    // ETH @ $3k → 4 decimals
    expect(formatCoinBalanceByFiatRate('1.23456789', 'en-US', 3000)).toEqual('1.2345…');
    expect(formatCoinBalanceByFiatRate('1.5', 'en-US', 3000)).toEqual('1.5');

    // SOL @ $150 → 3 decimals
    expect(formatCoinBalanceByFiatRate('1.23456789', 'en-US', 150)).toEqual('1.234…');

    // ADA @ $0.50 → 0 decimals
    expect(formatCoinBalanceByFiatRate('123.456', 'en-US', 0.5)).toEqual('123…');

    // DOGE @ $0.10 → 0 decimals
    expect(formatCoinBalanceByFiatRate('1234.5', 'en-US', 0.1)).toEqual('1,234…');

    // SHIB @ $0.00002 → 0 decimals
    expect(formatCoinBalanceByFiatRate('50000', 'en-US', 0.00002)).toEqual('50,000');

    // Sub-decimal dust on a high-priced coin → surface "< x" hint
    expect(formatCoinBalanceByFiatRate('0.000001', 'en-US', 60000)).toEqual('< 0.00001');
    expect(formatCoinBalanceByFiatRate('0.5', 'en-US', 0.1)).toEqual('< 1');

    // Locale propagation
    expect(formatCoinBalanceByFiatRate('1234.5678', 'cs-CZ', 3000)).toEqual('1\xa0234,5678');
});
