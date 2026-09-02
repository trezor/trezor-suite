import { sanitizeFilename } from './sanitizeFilename';

describe(sanitizeFilename.name, () => {
    it('valid wallet filenames', () => {
        expect(sanitizeFilename('silk_road_account')).toBe('silk_road_account');
        expect(sanitizeFilename('account last bull market')).toBe('account last bull market');
    });

    it('listings with illegal characters', () => {
        const filename = 'Order#992:BlueDreams/HighQuality|BTC_Only?No_Escrow*';
        const sanitized = sanitizeFilename(filename);

        expect(sanitized).toBe('Order#992_BlueDreams_HighQuality_BTC_Only_No_Escrow_');
    });

    it('control characters in hidden logs', () => {
        const filename = 'tor_circuit\nnode_entry\x00_hidden_service';
        const sanitized = sanitizeFilename(filename);
        expect(sanitized).toBe('tor_circuit_node_entry__hidden_service');
    });

    it('reserved device names', () => {
        expect(sanitizeFilename('CON')).toBe('CON_');
        expect(sanitizeFilename('PRN')).toBe('PRN_');
        expect(sanitizeFilename('NUL')).toBe('NUL_');
        expect(sanitizeFilename('AUX')).toBe('AUX_');
        expect(sanitizeFilename('COM1')).toBe('COM1_');
        expect(sanitizeFilename('con')).toBe('con_');
    });

    it('filenames that look reserved but are valid identifiers', () => {
        expect(sanitizeFilename('control_panel_access')).toBe('control_panel_access');
        expect(sanitizeFilename('auxiliary_keys.txt')).toBe('auxiliary_keys.txt');
        expect(sanitizeFilename('COM0_port_sniff')).toBe('COM0_port_sniff');
    });

    it('trying to hide files with trailing dots or spaces', () => {
        expect(sanitizeFilename('trezor_7_backup.')).toBe('trezor_7_backup');
        expect(sanitizeFilename('private_keys ')).toBe('private_keys');
        expect(sanitizeFilename('drop_location_coords. . ')).toBe('drop_location_coords');
    });

    it('filenames with custom separator for dates', () => {
        const filename = 'transaction:hash:block';

        expect(sanitizeFilename(filename, '-')).toBe('transaction-hash-block');

        expect(sanitizeFilename(filename, '')).toBe('transactionhashblock');
    });

    it('unicode and emoji in listings', () => {
        expect(sanitizeFilename('💊_250mg_stealth_delivery')).toBe('💊_250mg_stealth_delivery');
        expect(sanitizeFilename('🚀_to_the_moon_earnings')).toBe('🚀_to_the_moon_earnings');
        expect(sanitizeFilename('❄️_pure_quality')).toBe('❄️_pure_quality');
    });

    it('empty or whitespace-only inputs', () => {
        expect(sanitizeFilename('')).toBe(undefined);
        expect(sanitizeFilename('   ')).toBe(undefined);
    });

    it('filenames that become empty after sanitization', () => {
        expect(sanitizeFilename('...')).toBe(undefined);
        expect(sanitizeFilename('   .   ')).toBe(undefined);
    });

    it('truncation of massive filename', () => {
        const tooLong = 'a'.repeat(300);
        const sanitized = sanitizeFilename(tooLong);

        expect(sanitized).toBeDefined();
        expect(sanitized!.length).toBe(250);
        expect(sanitized).toBe('a'.repeat(250));
    });
});
