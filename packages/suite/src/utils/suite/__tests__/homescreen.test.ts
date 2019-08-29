import * as Canvas from 'canvas';
import * as crypto from 'crypto';

import * as homescreen from '../homescreen';

const homescreensPath = '../suite-data/files/images/suite/homescreens';

// to simplify assertions of hex return values
const getHash = (str: string) => {
    return crypto
        .createHash('md5')
        .update(str)
        .digest('hex');
};

const getMockElementToImageData = (image: HTMLImageElement) => {
    // @ts-ignore
    return (element, w, h) => {
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
        imgHashFixtures.forEach(async (fixture: Fixture) => {
            it(`${fixture.img} should result in hex that results in hash ${fixture.hexHash}`, async () => {
                const image: any = await Canvas.loadImage(
                    `${homescreensPath}/t${fixture.model}/${fixture.img}`,
                );
                const fooElement = document.createElement('img');

                // elementToImageData must be mocked with module working in node environment
                const spy = jest.spyOn(homescreen, 'elementToImageData');
                spy.mockImplementationOnce(getMockElementToImageData(image));

                const hex = homescreen.elementToHomescreen(fooElement, fixture.model);
                expect(getHash(hex)).toEqual(fixture.hexHash);
            });
        });
    });

    describe('checkImage', () => {
        describe('with correct dimensions', () => {
            imgHashFixtures.forEach(async (fixture: Fixture) => {
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
            imgHashFixtures.forEach(async (fixture: Fixture) => {
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
});
