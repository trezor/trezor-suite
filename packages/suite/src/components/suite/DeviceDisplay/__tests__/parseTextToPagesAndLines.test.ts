import { DeviceModelInternal } from '@trezor/connect';
import {
    ParseTextToLinesParams,
    ParseTextToLinesResult,
    parseTextToPagesAndLines,
} from '../parseTextToPagesAndLines';

describe(parseTextToPagesAndLines.name, () => {
    const dataProvider: {
        it: string;
        input: ParseTextToLinesParams;
        expected: ParseTextToLinesResult;
    }[] = [
        {
            it: 'Trezor One address',
            input: {
                device: DeviceModelInternal.T1B1,
                text: 'bc1qsexljl54vsc9hlwldrsd455kl7q29wvq9rnmua',
            },
            expected: {
                pages: [
                    {
                        rows: [
                            { text: 'bc1qsexljl54vsc9hlwld' },
                            { text: 'rsd455kl7q29wvq9rnmua' },
                        ],
                    },
                ],
            },
        },
        {
            it: 'Trezor One XPUB',
            input: {
                device: DeviceModelInternal.T1B1,
                text: 'zpub6qWFmC4WMAU5pDeAmqhWRCu2yoPYs7ZeeFkjPmpPh9R8XRkUcNoYGBFNTS8Ru64UT9BZqCEtbxkYvF69K6bsPAqUiLtTfcy8mnpLwDM1vsz',
            },
            expected: {
                pages: [
                    {
                        rows: [
                            { text: 'zpub6qWFmC4WMAU5pDeAm' },
                            { text: 'qhWRCu2yoPYs7ZeeFkjPm' },
                            { text: 'pPh9R8XRkUcNoYGBFNTS8' },
                            { text: 'Ru64UT9BZqCEtbxkYv' },
                        ],
                    },
                    {
                        rows: [
                            { text: 'F69K6bsPAqUiLtTfcy8mn' },
                            { text: 'pLwDM1vsz' },
                            //
                        ],
                    },
                ],
            },
        },
    ];

    dataProvider.forEach(row => {
        it(row.it, () => {
            expect(parseTextToPagesAndLines(row.input)).toStrictEqual(row.expected);
        });
    });
});
