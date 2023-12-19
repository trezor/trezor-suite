import { parseCSV } from '../csvParserUtils';

const FIXTURES = [
    {
        description: 'csv without header',
        csv: `bcAddRe5,0.2,usd\r"bcAddRe5",0.1,"CZK"`,
        columns: ['address', 'amount', 'currency'],
        result: [
            { address: 'bcAddRe5', amount: '0.2', currency: 'usd' },
            { address: 'bcAddRe5', amount: '0.1', currency: 'CZK' },
        ],
    },
    {
        description: 'csv with header and empty lines',
        csv: `address,amount,currency\n\n\r\nbcAddRe5,0.2,usd\r"bcAddRe5",0.1,"CZK"`,
        columns: ['address', 'amount', 'currency'],
        result: [
            { address: 'bcAddRe5', amount: '0.2', currency: 'usd' },
            { address: 'bcAddRe5', amount: '0.1', currency: 'CZK' },
        ],
    },
    {
        description: 'csv without specified columns',
        csv: `bcAddRe5,0.2,usd\r"bcAddRe5",0.1,"CZK"`,
        result: [
            { '0': 'bcAddRe5', '1': '0.2', '2': 'usd' },
            { '0': 'bcAddRe5', '1': '0.1', '2': 'CZK' },
        ],
    },
    {
        description: 'csv without specified delimiter',
        csv: `bcAddRe5`,
        result: [{ '0': 'bcAddRe5' }],
    },
    {
        description: 'csv with mixed delimiters (first used)',
        csv: `1,2;3|4\t5^6`,
        result: [{ '0': '1', '1': '2;3|4\t5^6' }],
    },
    {
        description: 'csv with mixed delimiters (special char detected)',
        csv: `1,2;3|4\t5^6|123`,
        result: [{ '0': '1,2;3', '1': '4\t5^6', '2': '123' }],
    },
    {
        description: 'csv with defined delimiter',
        csv: `a#b#c`,
        delimiter: '#',
        result: [{ '0': 'a', '1': 'b', '2': 'c' }],
    },
];

describe('csvParser.parseCSV', () => {
    FIXTURES.forEach(f => {
        it(f.description, () => {
            expect(parseCSV(f.csv, f.columns, f.delimiter)).toEqual(f.result);
        });
    });
});
