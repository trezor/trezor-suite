import { crc32 } from '../../src/protocol-thp/crypto/crc32';

describe('crc32', () => {
    it('simple', () => {
        const input = Buffer.from('hey sup bros');
        const expected = Buffer.from([0x47, 0xfa, 0x55, 0x70]);
        expect(crc32(input)).toEqual(expected);
    });

    it('more complex', () => {
        let input = Buffer.from([0x00, 0x00, 0x00]);
        let expected = Buffer.from([0xff, 0x41, 0xd9, 0x12]);
        expect(crc32(input)).toEqual(expected);
    });

    it('extreme', () => {
        let input = Buffer.from('शीर्षक');
        let expected = Buffer.from([0x17, 0xb8, 0xaf, 0xf1]);
        expect(crc32(input)).toEqual(expected);
    });
});

// test('another simple one', function (t) {
//     var input = Buffer.from('IEND');
//     var expected = Buffer.from([0xae, 0x42, 0x60, 0x82]);
//     t.same(crc32(input), expected);
//     t.end();
// });

// test('slightly more complex', function (t) {
//     var input = Buffer.from([0x00, 0x00, 0x00]);
//     var expected = Buffer.from([0xff, 0x41, 0xd9, 0x12]);
//     t.same(crc32(input), expected);
//     t.end();
// });

// test('complex crc32 gets calculated like a champ', function (t) {
//     var input = Buffer.from('शीर्षक');
//     var expected = Buffer.from([0x17, 0xb8, 0xaf, 0xf1]);
//     t.same(crc32(input), expected);
//     t.end();
// });

// test('casts to buffer if necessary', function (t) {
//     var input = 'शीर्षक';
//     var expected = Buffer.from([0x17, 0xb8, 0xaf, 0xf1]);
//     t.same(crc32(input), expected);
//     t.end();
// });

// test('can do signed', function (t) {
//     var input = 'ham sandwich';
//     var expected = -1891873021;
//     t.same(crc32.signed(input), expected);
//     t.end();
// });

// test('can do unsigned', function (t) {
//     var input = 'bear sandwich';
//     var expected = 3711466352;
//     t.same(crc32.unsigned(input), expected);
//     t.end();
// });

// test('simple crc32 in append mode', function (t) {
//     var input = [
//         Buffer.from('hey'),
//         Buffer.from(' '),
//         Buffer.from('sup'),
//         Buffer.from(' '),
//         Buffer.from('bros'),
//     ];
//     var expected = Buffer.from([0x47, 0xfa, 0x55, 0x70]);
//     for (var crc = 0, i = 0; i < input.length; i++) {
//         crc = crc32(input[i], crc);
//     }
//     t.same(crc, expected);
//     t.end();
// });

// test('can do signed in append mode', function (t) {
//     var input1 = 'ham';
//     var input2 = ' ';
//     var input3 = 'sandwich';
//     var expected = -1891873021;

//     var crc = crc32.signed(input1);
//     crc = crc32.signed(input2, crc);
//     crc = crc32.signed(input3, crc);

//     t.same(crc, expected);
//     t.end();
// });

// test('make sure crc32 can accept integers as first arg ', function (t) {
//     try {
//         t.same(crc32(0), Buffer.from([0x00, 0x00, 0x00, 0x00]));
//     } catch (e) {
//         t.fail('should be able to accept integer');
//     } finally {
//         t.end();
//     }
// });

// test('make sure crc32 throws on bad input', function (t) {
//     try {
//         crc32({});
//         t.fail('should fail on garbage input');
//     } catch (e) {
//         t.ok('should pass');
//     } finally {
//         t.end();
//     }
// });

// test('can do unsigned in append mode', function (t) {
//     var input1 = 'bear san';
//     var input2 = 'dwich';
//     var expected = 3711466352;

//     var crc = crc32.unsigned(input1);
//     crc = crc32.unsigned(input2, crc);
//     t.same(crc, expected);
//     t.end();
// });
