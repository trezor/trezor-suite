import { useCallback, useMemo, useRef, useState } from 'react';

import { Translation, useTranslation } from '@suite/intl';
import { type TokenAddress } from '@suite-common/tokens';
import { updateFiatRatesThunk } from '@suite-common/wallet-core';
import { type Timestamp } from '@suite-common/wallet-types';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { Box, Divider } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { SearchAsset } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';

import { AssetGroupLabel } from '#src/components/suite/asset-picker/components/AssetRow/AssetGroupLabel';
import { AssetGroupSpace } from '#src/components/suite/asset-picker/components/AssetRow/AssetGroupSpace';
import { AssetGroupsCard } from '#src/components/suite/asset-picker/components/AssetRow/AssetGroupsCard';
import { AssetRowAccountWithBalance } from '#src/components/suite/asset-picker/components/AssetRow/AssetRowAccount/AssetRowAccountWithBalance';
import { AssetRowToken } from '#src/components/suite/asset-picker/components/AssetRow/AssetRowToken/AssetRowToken';
import { ExpandableAssetRowGroup } from '#src/components/suite/asset-picker/components/AssetRow/ExpandableAssetRowGroup/ExpandableAssetRowGroup';
import { AssetsList } from '#src/components/suite/asset-picker/components/AssetsList/AssetsList';
import { AssetsListEmpty } from '#src/components/suite/asset-picker/components/AssetsListEmpty/AssetsListEmpty';
import { AssetsModal } from '#src/components/suite/asset-picker/components/AssetsModal/AssetsModal';
import { useExpandableGroups } from '#src/components/suite/asset-picker/hooks/useExpandableGroups';
import { useFilterAccountsWithTokens } from '#src/components/suite/asset-picker/hooks/useFilterAccountsWithTokens';
import { useListScrollReset } from '#src/components/suite/asset-picker/hooks/useListScrollReset';
import { createTokenOption } from '#src/components/suite/asset-picker/utils/assetOptions';
import { useSendFormContext } from '#src/hooks/wallet/useSendForm';
import { type TokensWithRates } from '#src/utils/wallet/tokenUtils';

import { AssetRowNFT } from './AssetRowNFT/AssetRowNFT';
import { useBuildTokenOptions } from './hooks/useBuildTokenOptions';
import { useNFTOptions } from './hooks/useNFTOptions';
import {
    type NFTOption,
    type SendTokenPickerItem,
    filterNFTOptions,
    getSendTokenPickerItemHeight,
    withNFTGroupLabel,
} from './nftOptions';

interface SelectTokenAssetModalProps {
    onModalClose: () => void;
    outputId: number;
    tokenInputName: `outputs.${number}.token`;
}

const LIST_HEIGHT = 480;

export function SelectTokenAssetModal({
    onModalClose,
    outputId,
    tokenInputName,
}: SelectTokenAssetModalProps) {
    // React Compiler: `watch` keeps one identity for the form's whole life, so a compiled
    // render-time read of it freezes on the first render. Remove once these reads move to
    // `useWatch` or out of render.
    'use no memo';

    const {
        account,
        clearErrors,
        setAmount,
        getDefaultValue,
        toggleOption,
        composeTransaction,
        watch,
        setValue,
        resetDraft,
        setMax,
    } = useSendFormContext();

    const { translationString } = useTranslation();
    const { dispatch } = useServices(injectDispatch);

    const [search, setSearch] = useState('');
    const { expandedGroupKeys, toggleGroup } = useExpandableGroups();
    const listRef = useRef<HTMLDivElement>(null);

    const dataEnabled = getDefaultValue('options', []).includes('transactionData');

    const amountInputName = `outputs.${outputId}.amount` as const;
    const fiatInputName = `outputs.${outputId}.fiat` as const;
    const currencyInputName = `outputs.${outputId}.currency` as const;

    const currencyValue = watch(currencyInputName);

    const options = useBuildTokenOptions({
        account,
        expandedHiddenTokensGroups: expandedGroupKeys,
    });
    const filteredOptions = useFilterAccountsWithTokens({ accountsWithTokens: options, search });
    const nftOptions = useNFTOptions(account);
    const listItems = useMemo(
        (): SendTokenPickerItem[] => [
            ...filteredOptions,
            ...withNFTGroupLabel(filterNFTOptions(nftOptions, search)),
        ],
        [filteredOptions, nftOptions, search],
    );

    useListScrollReset(listRef, search);

    // Returns whether set-max was on; selecting any asset turns it off.
    const replaceSelectedAsset = useCallback(
        (contract: string | null, nftTokenId: string | undefined, amount: string) => {
            resetDraft();

            setValue(tokenInputName, contract, { shouldDirty: true });
            setValue(`outputs.${outputId}.nftTokenId`, nftTokenId, { shouldDirty: true });
            setValue(amountInputName, amount, { shouldDirty: true });
            setValue(fiatInputName, '', { shouldDirty: true });

            const isSetMaxActive = getDefaultValue('setMaxOutputId') === outputId;

            if (isSetMaxActive) {
                setMax(outputId, isSetMaxActive);
            }

            onModalClose();

            return isSetMaxActive;
        },
        [
            amountInputName,
            fiatInputName,
            getDefaultValue,
            onModalClose,
            outputId,
            resetDraft,
            setMax,
            setValue,
            tokenInputName,
        ],
    );

    const handleSelectChange = useCallback(
        async (newlySelectedToken?: TokensWithRates) => {
            const isSetMaxActive = replaceSelectedAsset(
                newlySelectedToken?.contract || null,
                undefined,
                '',
            );

            await dispatch(
                updateFiatRatesThunk({
                    tickers: [
                        {
                            symbol: account.symbol,
                            tokenAddress: (newlySelectedToken?.contract || '') as TokenAddress,
                            protocols: newlySelectedToken?.protocols,
                        },
                    ],
                    baseCurrencyCode: currencyValue.value as BaseCurrencyCode,
                    rateType: 'current',
                    fetchAttemptTimestamp: Date.now() as Timestamp,
                }),
            );
            // Clear errors in Amount input.
            clearErrors(amountInputName);
            // Remove Amount if set max or ETH data options are enabled.
            if (isSetMaxActive || dataEnabled) setAmount(outputId, '');
            // Remove ETH data option.
            if (dataEnabled) toggleOption('transactionData');
            // Compose, which can be prevented by Amount re-validation above.
            composeTransaction(amountInputName);
        },
        [
            account.symbol,
            amountInputName,
            clearErrors,
            composeTransaction,
            currencyValue.value,
            dataEnabled,
            dispatch,
            outputId,
            replaceSelectedAsset,
            setAmount,
            toggleOption,
        ],
    );

    // Always one item for now, also for ERC-1155. NFTs have no fiat rate to fetch.
    const handleNFTSelect = useCallback(
        ({ token, tokenId }: NFTOption) => {
            replaceSelectedAsset(token.contract, tokenId, '1');
            clearErrors(amountInputName);
            if (dataEnabled) toggleOption('transactionData');
            composeTransaction(amountInputName);
        },
        [
            amountInputName,
            clearErrors,
            composeTransaction,
            dataEnabled,
            replaceSelectedAsset,
            toggleOption,
        ],
    );

    const handleAccountClick = useCallback(() => handleSelectChange(), [handleSelectChange]);

    const renderItem = useCallback(
        (item: SendTokenPickerItem) => {
            switch (item.type) {
                case 'account':
                    return (
                        <AssetRowAccountWithBalance
                            dataTestId={`@asset-picker/send-token/option/${item.account.symbol}`}
                            account={item.account}
                            onClick={handleAccountClick}
                        />
                    );

                case 'token':
                    return (
                        <AssetRowToken
                            dataTestId={`@asset-picker/send-token/option/${item.account.symbol}/${item.token.symbol}`}
                            token={item.token}
                            account={item.account}
                            onClick={handleSelectChange}
                        />
                    );

                case 'hidden-tokens':
                    return (
                        <AssetGroupsCard height={getSendTokenPickerItemHeight(item)}>
                            <ExpandableAssetRowGroup
                                label="TR_HIDDEN_TOKENS"
                                account={item.account}
                                items={item.tokens.map(token =>
                                    createTokenOption(item.account, token),
                                )}
                                renderItem={groupItem =>
                                    groupItem.type === 'token' && (
                                        <AssetRowToken
                                            token={groupItem.token}
                                            account={groupItem.account}
                                            onClick={handleSelectChange}
                                            isInsideGroup
                                        />
                                    )
                                }
                                expanded={item.expanded}
                                onExpandToggle={expanded => {
                                    toggleGroup(item.account.key, expanded);
                                }}
                                dataTestId={`@asset-picker/send-token/option/hidden-tokens/${item.account.symbol}`}
                            />
                        </AssetGroupsCard>
                    );

                case 'nft':
                    return (
                        <AssetRowNFT
                            dataTestId={`@asset-picker/send-token/option/${item.account.symbol}/nft/${item.token.contract}/${item.tokenId}`}
                            option={item}
                            onClick={handleNFTSelect}
                        />
                    );

                case 'group-label':
                    return <AssetGroupLabel label={item.label} />;

                case 'group-space':
                    return <AssetGroupSpace size={item.size} />;

                case 'asset-groups':
                    return null;
            }
        },
        [handleAccountClick, handleNFTSelect, handleSelectChange, toggleGroup],
    );

    return (
        <AssetsModal heading={<Translation id="TR_SELECT_TOKEN" />} onClose={onModalClose}>
            <Box padding={{ horizontal: 16 }}>
                <SearchAsset
                    searchPlaceholder={translationString('TR_SEARCH_TOKEN_IN_SEND_FORM_MODAL')}
                    search={search}
                    setSearch={setSearch}
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                />
            </Box>

            <Divider margin={{ top: 16 }} />

            <AssetsListEmpty
                isEmpty={listItems.length === 0}
                heading="TR_TOKEN_NOT_FOUND"
                description={search ? 'TR_TOKEN_TRY_DIFFERENT_SEARCH' : undefined}
                height={LIST_HEIGHT}
            >
                <AssetsList
                    items={listItems}
                    renderItem={renderItem}
                    getItemHeight={getSendTokenPickerItemHeight}
                    height={LIST_HEIGHT}
                    ref={listRef}
                />
            </AssetsListEmpty>
        </AssetsModal>
    );
}
