import { CoinmarketSideWrapper } from 'src/views/wallet/coinmarket/common/CoinmarketWrapper';

interface CoinmarketSelectedOfferWrapperProps {
    leftChildren: React.ReactNode;
    rightChildren: React.ReactNode;
}

export const CoinmarketSelectedOfferWrapper = ({
    leftChildren,
    rightChildren,
}: CoinmarketSelectedOfferWrapperProps) => (
    <>
        <CoinmarketSideWrapper side="left" isLeftSideWithoutPadding>
            {leftChildren}
        </CoinmarketSideWrapper>
        <CoinmarketSideWrapper side="right">{rightChildren}</CoinmarketSideWrapper>
    </>
);
