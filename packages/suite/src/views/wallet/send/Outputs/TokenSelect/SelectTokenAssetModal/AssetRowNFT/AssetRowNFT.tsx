import { AssetIcon } from '@suite/assets';
import { HiddenPlaceholder, RedactNumericalValue } from '@suite/discreet-mode';
import { toTokenAddress } from '@suite-common/tokens';
import { Row, Text } from '@trezor/components';

import { AssetDetails } from '#src/components/suite/asset-picker/components/AssetRow/AssetDetails';
import { ItemClickableContainer } from '#src/components/suite/asset-picker/components/AssetRow/ItemClickableContainer';

import { type NFTOption } from '../nftOptions';

type AssetRowNFTProps = {
    option: NFTOption;
    onClick: (option: NFTOption) => void;
    dataTestId?: string;
};

export function AssetRowNFT({ option, onClick, dataTestId }: AssetRowNFTProps) {
    const { account, token, tokenId } = option;
    const contractAddress = toTokenAddress(token.contract);

    return (
        <ItemClickableContainer onClick={() => onClick(option)}>
            <Row data-testid={dataTestId} gap={12} overflow="hidden" flex="1" minWidth={0}>
                <AssetIcon
                    size={40}
                    networkSymbol={account.symbol}
                    contractAddress={contractAddress}
                    shouldTryToFetch={false}
                />
                <AssetDetails networkSymbol={account.symbol} contractAddress={contractAddress} />
            </Row>
            <Row flex="0 1 auto" minWidth={0} maxWidth="40%">
                <Text
                    typographyStyle="body-sm"
                    intent="neutral"
                    priority="secondary"
                    ellipsisLineCount={1}
                >
                    <HiddenPlaceholder>
                        #<RedactNumericalValue value={tokenId} />
                    </HiddenPlaceholder>
                </Text>
            </Row>
        </ItemClickableContainer>
    );
}
