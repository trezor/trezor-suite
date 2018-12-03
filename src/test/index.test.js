describe.skip('getLatestSafeFw()', () => {
    it('should not return latest fw if it has bootloader version higher than bl version of device', () => {
        const t1 = new T1({ fwVersion: '1.6.3' }); // this is not latest
        const update = trezorUpdate.getLatestSafeFw(t1.features);
        console.log(update);
    });
});
