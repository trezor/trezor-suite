import { Translation, useTranslation } from '@suite/intl';
import { gotoThunk, selectSettingsBackRoute } from '@suite/router';
import {
    selectWalletAssetContractAddress,
    selectWalletAssetDisplaySymbol,
    selectWalletAssetName,
    selectWalletAssetSymbol,
} from '@suite-common/assets';
import { useFormatters } from '@suite-common/formatters';
import { selectIsSpecificCoinDefinitionKnown } from '@suite-common/token-definitions';
import { Column, IconButton, Row, Text } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { CaretLeftIcon } from '@trezor/icons';
import { TokenIcon } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';

import { TokenUrlBlur } from 'src/components/suite/TokenUrlBlur';
import { useSelector } from 'src/hooks/suite';
import { selectRoutedAssetKey } from 'src/views/home/AssetDetail/selectRoutedAssetKey';

const AssetDetailBackButton = () => {
    const { dispatch } = useServices(injectDispatch);
    const previousRoute = useSelector(selectSettingsBackRoute);
    const { translationString } = useTranslation();

    const goBack = () =>
        dispatch(gotoThunk({ routeName: previousRoute.name, params: previousRoute.params }));

    return (
        <IconButton
            icon={CaretLeftIcon}
            intent="neutral"
            priority="secondary"
            size="large"
            onClick={goBack}
            data-testid="@asset-detail/back"
            aria-label={translationString('TR_BACK')}
            tooltip={{ content: <Translation id="TR_BACK" /> }}
        />
    );
};

export const AssetDetailName = () => {
    const assetKey = useSelector(selectRoutedAssetKey);
    const { NetworkNameFormatter } = useFormatters();
    const symbol = useSelector(state => selectWalletAssetSymbol(state, assetKey));
    const contractAddress = useSelector(state => selectWalletAssetContractAddress(state, assetKey));
    const displaySymbol = useSelector(state => selectWalletAssetDisplaySymbol(state, assetKey));
    const name = useSelector(state => selectWalletAssetName(state, assetKey));
    // A recognized token may carry a URL in its name, so only an unrecognized one is blurred,
    // as on the account's token list.
    const isNameTrusted = useSelector(
        state =>
            symbol === undefined ||
            contractAddress === undefined ||
            selectIsSpecificCoinDefinitionKnown(state, symbol, contractAddress),
    );

    return (
        <Row alignItems="center" gap={16}>
            <AssetDetailBackButton />
            {symbol !== undefined && (
                <Row gap={12} minWidth={0}>
                    <TokenIcon
                        symbol={symbol}
                        contractAddress={contractAddress}
                        size={32}
                        showNetworkIcon
                        placeholder={displaySymbol ?? ''}
                    />
                    <Column alignItems="flex-start" minWidth={0}>
                        <Text typographyStyle="body-md-strong" ellipsisLineCount={1}>
                            {isNameTrusted ? name : <TokenUrlBlur text={name} />}
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
