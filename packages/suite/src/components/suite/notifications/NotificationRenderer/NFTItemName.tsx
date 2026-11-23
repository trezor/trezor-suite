import { AssetName } from '@suite/assets';
import { RedactNumericalValue } from '@suite/discreet-mode';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Row } from '@trezor/components';

type NFTItemNameProps = {
    networkSymbol: NetworkSymbol;
    contractAddress: TokenAddress;
    tokenId: string;
};

export const NFTItemName = ({ networkSymbol, contractAddress, tokenId }: NFTItemNameProps) => (
    <Row display="inline-flex" gap={4} alignItems="baseline">
        <AssetName networkSymbol={networkSymbol} contractAddress={contractAddress} />
        <span>
            #<RedactNumericalValue value={tokenId} />
        </span>
    </Row>
);
