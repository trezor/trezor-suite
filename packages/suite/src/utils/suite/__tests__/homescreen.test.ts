import * as Canvas from 'canvas';
import crypto from 'crypto';

import * as homescreen from '../homescreen';

const homescreensPath = '../suite-data/files/images/png/homescreens';

// to simplify assertions of hex return values
const getHash = (str: string) => {
    return crypto.createHash('md5').update(str).digest('hex');
};

const getMockElementToImageData = (image: HTMLImageElement) => {
    return (_element: HTMLImageElement, w: number, h: number) => {
        const canvas = Canvas.createCanvas(w, h);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);

        // you can test visually if proper imageData was returned this way:
        // console.log(`<img src="${canvas.toDataURL()}" />`);

        const imageData = ctx.getImageData(0, 0, w, h);
        return imageData;
    };
};
const imgHashFixtures = [
    {
        model: 2,
        img: 'btc.png',
        hexHash: '0f15d6b5d66126e1c9fc54c263323bf9',
    },
    {
        model: 2,
        img: 'doge.png',
        hexHash: 'cfae6996e66d3d67dbfe7cbe01805dd5',
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

    describe('checkImage', () => {
        describe('with correct dimensions', () => {
            imgHashFixtures.forEach((fixture: Fixture) => {
                it(`${fixture.img} should be checked as ok`, async () => {
                    const image: any = await Canvas.loadImage(
                        `${homescreensPath}/t${fixture.model}/${fixture.img}`,
                    );

                    const spy = jest.spyOn(homescreen, 'elementToImageData');
                    spy.mockImplementationOnce(getMockElementToImageData(image));
                    expect(() => homescreen.checkImage(image, fixture.model)).not.toThrow();
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
                    expect(() => homescreen.checkImage(image, swappedModel)).toThrow(
                        'Not a correct height.',
                    );
                });
            });
        });
    });

    describe('isValid', () => {
        describe('returns true for', () => {
            const validExamples = [
                'data:image/png,deadbeef',
                'data:image/jpeg',
                'data:image/jpeg,',
                'data:image/jpegsomecontent',
            ];
            it.each(validExamples)(`%p`, dataUrl => {
                expect(homescreen.isValid(dataUrl)).toBe(true);
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
                expect(homescreen.isValid(dataUrl)).toBe(false);
            });
        });

        describe('returns false for null', () => {
            // defensively test a corner case violating type-checking
            // @ts-ignore
            expect(homescreen.isValid(null)).toBe(false);
        });
    });
});
