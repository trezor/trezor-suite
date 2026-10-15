import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import {
    selectWalletAssetContractAddress,
    selectWalletAssetDisplaySymbol,
    selectWalletAssetName,
    selectWalletAssetSymbol,
} from '@suite-common/assets';
import { useFormatters } from '@suite-common/formatters';
import { Column, IconButton, Row, Text } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { CaretLeftIcon } from '@trezor/icons';
import { TokenIcon } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from 'src/hooks/suite';
import { useAssetDetailKey } from 'src/views/home/AssetDetail/useAssetDetailKey';
import { BlurUrls } from 'src/views/wallet/tokens/common/BlurUrls';

export const AssetDetailName = () => {
    const { dispatch } = useServices(injectDispatch);
    const { NetworkNameFormatter } = useFormatters();
    const assetKey = useAssetDetailKey();
    const symbol = useSelector(state =>
        assetKey === undefined ? undefined : selectWalletAssetSymbol(state, assetKey),
    );
    const contractAddress = useSelector(state =>
        assetKey === undefined ? undefined : selectWalletAssetContractAddress(state, assetKey),
    );
    const displaySymbol = useSelector(state =>
        assetKey === undefined ? undefined : selectWalletAssetDisplaySymbol(state, assetKey),
    );
    const name = useSelector(state =>
        assetKey === undefined ? undefined : selectWalletAssetName(state, assetKey),
    );

    return (
        <Row alignItems="center" gap={16}>
            <IconButton
                icon={CaretLeftIcon}
                intent="neutral"
                priority="secondary"
                size="large"
                onClick={() => dispatch(gotoThunk({ routeName: 'suite-index' }))}
                data-testid="@asset-detail/back"
                tooltip={{ content: <Translation id="TR_BACK" /> }}
            />
            {symbol !== undefined && name !== undefined && (
                <Row gap={12}>
                    <TokenIcon
                        symbol={symbol}
                        contractAddress={contractAddress}
                        size={32}
                        showNetworkIcon
                        placeholder={displaySymbol ?? ''}
                    />
                    <Column alignItems="flex-start">
                        <Text typographyStyle="body-md-strong" ellipsisLineCount={1}>
                            <BlurUrls text={name} />
                        </Text>
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <NetworkNameFormatter value={symbol} />
                        </Text>
                    </Column>
                </Row>
            )}
        </Row>
    );
};
