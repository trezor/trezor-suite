import fs from 'fs';
import path from 'path';
import Logger, { Options } from '../libs/logger';

const testOptions: Options = {
    colors: false,
    logFormat: '%lvl(%top): %msg',
    outputFile: 'test-log.txt',
    outputPath: __dirname,
};
const output = path.join(testOptions.outputPath ?? '', testOptions.outputFile ?? '');

describe('logger', () => {
    let spy: any;
    beforeEach(() => {
        spy = jest.spyOn(global.console, 'log').mockImplementation();
    });
    afterEach(() => {
        spy.mockRestore();
    });
    afterAll(() => {
        // Clean up (delete log file)
        fs.unlinkSync(output);
    });

    it('Level "mute" should not log any messages', () => {
        const logger = new Logger('mute', testOptions);
        logger.error('test', 'A');
        logger.warn('test', 'B');
        logger.info('test', 'C');
        logger.debug('test', 'D');
        expect(spy).toHaveBeenCalledTimes(0);
    });
    it('Level "error" should only show error messages', () => {
        const logger = new Logger('error', testOptions);
        logger.error('test', 'A');
        logger.warn('test', 'B');
        logger.info('test', 'C');
        logger.debug('test', 'D');
        expect(console.log).toHaveBeenCalledTimes(1);
        expect(spy.mock.calls).toEqual([['ERROR(test): A']]);
    });
    it('Level "warn" should show error and warning messages', () => {
        const logger = new Logger('warn', testOptions);
        logger.error('test', 'A');
        logger.warn('test', 'B');
        logger.info('test', 'C');
        logger.debug('test', 'D');
        expect(console.log).toHaveBeenCalledTimes(2);
        expect(spy.mock.calls).toEqual([['ERROR(test): A'], ['WARN(test): B']]);
    });
    it('Level "info" should show all messages except debug', () => {
        const logger = new Logger('info', testOptions);
        logger.error('test', 'A');
        logger.warn('test', 'B');
        logger.info('test', 'C');
        logger.debug('test', 'D');
        expect(console.log).toHaveBeenCalledTimes(3);
        expect(spy.mock.calls).toEqual([['ERROR(test): A'], ['WARN(test): B'], ['INFO(test): C']]);
    });
    it('Level "debug" should not log all messages', () => {
        const logger = new Logger('debug', testOptions);
        logger.error('test', 'A');
        logger.warn('test', 'B');
        logger.info('test', 'C');
        logger.debug('test', 'D');
        expect(console.log).toHaveBeenCalledTimes(4);
        expect(spy.mock.calls).toEqual([
            ['ERROR(test): A'],
            ['WARN(test): B'],
            ['INFO(test): C'],
            ['DEBUG(test): D'],
        ]);
    });
    it('Output file should be written', async () => {
        const logger = new Logger('debug', {
            ...testOptions,
            writeToDisk: true,
        });
        logger.error('test', 'A');
        logger.warn('test', 'B');
        logger.info('test', 'C');
        logger.debug('test', 'D');
        logger.exit();

        // Delay for file to finish writing
        await new Promise(res => setTimeout(res, 1000));

        const logFile = fs.readFileSync(output, { encoding: 'utf8' });
        expect(logFile).toBe('ERROR(test): A\nWARN(test): B\nINFO(test): C\nDEBUG(test): D\n');
    });
});
