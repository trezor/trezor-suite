import { CoinmarketLeftWrapper, CoinmarketRightWrapper } from 'src/views/wallet/coinmarket';

interface CoinmarketSelectedOfferWrapperProps {
    leftChildren: React.ReactNode;
    rightChildren: React.ReactNode;
}

export const CoinmarketSelectedOfferWrapper = ({
    leftChildren,
    rightChildren,
}: CoinmarketSelectedOfferWrapperProps) => (
    <>
        <CoinmarketLeftWrapper $isWithoutPadding>{leftChildren}</CoinmarketLeftWrapper>
        <CoinmarketRightWrapper>{rightChildren}</CoinmarketRightWrapper>
    </>
);
