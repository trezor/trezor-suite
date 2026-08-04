import { type NetworkSymbol } from '@suite-common/wallet-config';
import { QrCode, TokenIcon } from '@trezor/product-components';

// Kept small so the badge stays well within QR level H's ~30% error-correction budget and never
// damages the encoded data.
const COIN_LOGO_SIZE = 32;

type CoinQrCodeProps = {
    value: string;
    symbol: NetworkSymbol;
};

export const CoinQrCode = ({ value, symbol }: CoinQrCodeProps) => (
    <QrCode value={value} centerIcon={<TokenIcon symbol={symbol} size={COIN_LOGO_SIZE} />} />
);
