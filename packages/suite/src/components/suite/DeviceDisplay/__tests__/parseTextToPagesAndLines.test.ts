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
        // --------------- Trezor One ---------------

        {
            it: 'Trezor One: Address',
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
            it: 'Trezor One: XPUB',
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
                            { text: 'Ru64UT9BZqCEtbxkYv' }, // shorter, space for "..."
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

        // --------------- Trezor T ---------------

        // No case for 'Trezor T: Address', it is handled by different logic, as chunks are used
        {
            it: 'Trezor T: XPUB',
            input: {
                device: DeviceModelInternal.T2T1,
                text: 'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
            },
            expected: {
                pages: [
                    {
                        rows: [
                            { text: 'zpub6rszzdAK6Ruaf' },
                            { text: 'eRwyN8z1cgWcXCuKb' },
                            { text: 'LmjjfnrW4fWKtcoXQ' },
                            { text: '8787214pNJjnBG5UA' },
                            { text: 'TyghuNzjn6Lfp' }, // shorter, space for next-arrow
                        ],
                    },
                    {
                        rows: [
                            { text: '5k5xymrLFJnCy' }, // shorter, space for prev-arrow
                            { text: '46bMYJPyZsbpFGagT' },
                            //
                        ],
                    },
                ],
            },
        },

        // --------------- Trezor Safe3 ---------------

        // No case for 'Trezor Safe 3: Address', it is handled by different logic, as chunks are used
        {
            it: 'Trezor Safe 3 XPUB',
            input: {
                device: DeviceModelInternal.T2B1,
                text: 'zpub6rCCBgYm34WmcmW49pUvY5NmtG2oMwfCaDteT8xh8pEkKugU61KNjoYCAauoUgsDpufKTtnc8qYQaTbcawyBtbTvtFZEKjT5w12GNJr3xrB',
            },
            expected: {
                pages: [
                    {
                        rows: [
                            { text: 'zpub6rCCBgYm34Wmcm' },
                            { text: 'W49pUvY5NmtG2oMwfC' },
                            { text: 'aDteT8xh8pEkKugU61' },
                            { text: 'KNjoYCAauoUgsDpu' }, // shorter, space for next-arrow
                        ],
                    },
                    {
                        rows: [
                            { text: 'fKTtnc8qYQaTbcaw' }, // shorter, space for prev-arrow
                            { text: 'yBtbTvtFZEKjT5w12G' },
                            { text: 'NJr3xrB' },
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
