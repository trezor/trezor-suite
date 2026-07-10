import { type NetworkSymbol } from '@suite-common/wallet-config';
import { CoinLogo, QrCode } from '@trezor/product-components';

// Coin logo size that keeps the badge within the QR's safe center-coverage budget (see QrCode).
const COIN_LOGO_SIZE = 32;

type CoinQrCodeProps = {
    value: string;
    symbol: NetworkSymbol;
};

export const CoinQrCode = ({ value, symbol }: CoinQrCodeProps) => (
    <QrCode value={value} centerIcon={<CoinLogo symbol={symbol} size={COIN_LOGO_SIZE} />} />
);
