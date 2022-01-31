import * as Canvas from 'canvas';
import crypto from 'crypto';

import * as homescreen from '../homescreen';

const homescreensPath = '../suite-data/files/images/png/homescreens';

// to simplify assertions of hex return values
const getHash = (str: string) => crypto.createHash('md5').update(str).digest('hex');

const getMockElementToImageData =
    (image: HTMLImageElement) => (_element: HTMLImageElement, w: number, h: number) => {
        const canvas = Canvas.createCanvas(w, h);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);

        // you can test visually if proper imageData was returned this way:
        // console.log(`<img src="${canvas.toDataURL()}" />`);

        const imageData = ctx.getImageData(0, 0, w, h);
        return imageData;
    };
const imgHashFixtures = [
    {
        model: 2,
        img: 'btc.png',
        hexHash: '2f037dc4958b2fb1935f03069eff6c9d',
    },
    {
        model: 2,
        img: 'doge.png',
        hexHash: 'ab152b7d305f53d942a289ffc695e0f1',
    },
    {
        model: 1,
        img: 'ancap.png',
        hexHash: '28ec73580bab3dfcc1e827caca49d0cd',
    },
    {
        model: 1,
        img: 'anonymous.png',
        hexHash: 'f82d789c632b6924486c80d75c53285f',
    },
] as const;

interface Fixture {
    img: typeof imgHashFixtures[number]['img'];
    model: typeof imgHashFixtures[number]['model'];
    hexHash: typeof imgHashFixtures[number]['hexHash'];
}

describe('homescreen', () => {
    describe('imageDataToHomescreen', () => {
        imgHashFixtures.forEach((fixture: Fixture) => {
            it(`${fixture.img} should result in hex that results in hash ${fixture.hexHash}`, async () => {
                const image: any = await Canvas.loadImage(
                    `${homescreensPath}/t${fixture.model}/${fixture.img}`,
                );

                const fooElement = document.createElement('img');
                const hex = homescreen.elementToHomescreen(
                    fooElement,
                    fixture.model,
                    getMockElementToImageData(image),
                );
                expect(getHash(hex)).toEqual(fixture.hexHash);
            });
        });
    });

    describe('validate', () => {
        describe('with correct dimensions', () => {
            imgHashFixtures.forEach((fixture: Fixture) => {
                it(`${fixture.img} should be checked as ok`, async () => {
                    const image: any = await Canvas.loadImage(
                        `${homescreensPath}/t${fixture.model}/${fixture.img}`,
                    );

                    const spy = jest.spyOn(homescreen, 'elementToImageData');
                    spy.mockImplementationOnce(getMockElementToImageData(image));
                    expect(homescreen.validateImageDimensions(image, fixture.model)).toBe(
                        undefined,
                    );
                });
            });
        });

        describe('called with swapped trezorModel param', () => {
            imgHashFixtures.forEach((fixture: Fixture) => {
                it(`${fixture.img} should error with "Not a correct height error"`, async () => {
                    const image: any = await Canvas.loadImage(
                        `${homescreensPath}/t${fixture.model}/${fixture.img}`,
                    );
                    const spy = jest.spyOn(homescreen, 'elementToImageData');
                    spy.mockImplementationOnce(getMockElementToImageData(image));
                    const swappedModel = fixture.model === 1 ? 2 : 1;
                    expect(homescreen.validateImageDimensions(image, swappedModel)).toBe(
                        homescreen.ImageValidationError.InvalidHeight,
                    );
                });
            });
        });
    });

    describe('validateImageFormat', () => {
        describe('returns true for', () => {
            const validExamples = [
                'data:image/png,deadbeef',
                'data:image/jpeg',
                'data:image/jpeg,',
                'data:image/jpegsomecontent',
            ];
            it.each(validExamples)(`%p`, dataUrl => {
                expect(homescreen.validateImageFormat(dataUrl)).toBe(undefined);
            });
        });

        describe('returns false for', () => {
            const invalidExamples = [
                '',
                'xxx',
                'data',
                'data:',
                'data:deadbeef',
                'data:image',
                'data:jpeg', // missing image/ prefix
                'data:image/jpg', // this is different than valid "image/jpeg"
                'data:image/x-png',
                ' data:image/jpeg',
                'data:image\\jpeg',
                'data:image//jpeg',
                'data::image/jpeg',
                // also test some real-world data url examples
                'data:,Hello%2C%20World!',
                'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==',
                'data:text/html,%3Ch1%3EHello%2C%20World!%3C%2Fh1%3E',
            ];
            it.each(invalidExamples)(`%p`, dataUrl => {
                expect(homescreen.validateImageFormat(dataUrl)).toBe(
                    homescreen.ImageValidationError.InvalidFormat,
                );
            });
        });

        describe('returns false for null', () => {
            // defensively test a corner case violating type-checking
            // @ts-ignore
            expect(homescreen.validateImageFormat(null)).toBe(
                homescreen.ImageValidationError.InvalidFormat,
            );
        });
    });
});
