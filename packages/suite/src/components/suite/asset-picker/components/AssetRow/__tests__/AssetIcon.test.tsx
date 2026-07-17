import { render } from '@testing-library/react';

import { AssetIcon } from '@trezor/product-components';

jest.mock('react-svg', () => ({
    ReactSVG: ({ src }: { src: unknown }) => <span data-svg="1" data-src={String(src)} />,
}));

jest.mock('@suite-common/icons/src/cryptoIcons', () => ({
    cryptoIcons: new Proxy({}, { get: (_t, key) => `coin:${String(key)}` }),
}));

jest.mock('@suite-common/icons/src/networkIcons', () => ({
    networkIcons: new Proxy({}, { get: (_t, key) => `net:${String(key)}` }),
}));

const iconSrcs = (container: HTMLElement) =>
    Array.from(container.querySelectorAll('[data-svg="1"]')).map(n => n.getAttribute('data-src'));

describe('AssetIcon', () => {
    it('native L2 coin renders settlement-layer disc + own network badge', () => {
        // Base settles on Ethereum → ETH coin disc, Base network badge
        const { container } = render(<AssetIcon symbol="base" size={40} placeholder="ETH" />);
        expect(iconSrcs(container)).toEqual(['coin:eth', 'net:base']);
    });

    it('native L1 token-network coin renders disc + (redundant) own network badge', () => {
        const { container } = render(<AssetIcon symbol="eth" size={40} placeholder="ETH" />);
        expect(iconSrcs(container)).toEqual(['coin:eth', 'net:eth']);
    });

    it('native single-asset coin renders disc without a network badge', () => {
        const { container } = render(<AssetIcon symbol="btc" size={40} placeholder="BTC" />);
        expect(iconSrcs(container)).toEqual(['coin:btc']);
    });

    it('renders no badge below the minimum parent size', () => {
        const { container } = render(<AssetIcon symbol="eth" size={20} placeholder="ETH" />);
        expect(iconSrcs(container)).toEqual(['coin:eth']);
    });
});
