import { useCallback, useRef, useState } from 'react';

import { useTranslation } from '@suite/intl';
import { updateFiatRatesThunk } from '@suite-common/wallet-core';
import { type Timestamp, type TokenAddress } from '@suite-common/wallet-types';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { Box, Divider } from '@trezor/components';
import { SearchAsset } from '@trezor/product-components';

import {
    AssetRowAccountWithBalance,
    AssetRowToken,
    AssetsList,
    AssetsListEmpty,
    AssetsModal,
    ExpandableAssetRowGroup,
} from 'src/components/suite/asset-picker/components';
import {
    type AssetPickerListItem,
    useExpandableGroups,
    useFilterAccountsWithTokens,
    useListScrollReset,
} from 'src/components/suite/asset-picker/hooks';
import { createTokenOption } from 'src/components/suite/asset-picker/utils';
import { useDispatch } from 'src/hooks/suite';
import { useSendFormContext } from 'src/hooks/wallet';
import { type TokensWithRates } from 'src/utils/wallet/tokenUtils';

import { useBuildTokenOptions } from './hooks/useBuildTokenOptions';

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
    const dispatch = useDispatch();

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
    const filteredOptions = useFilterAccountsWithTokens(options, search);

    useListScrollReset(listRef, search);

    const handleSelectChange = useCallback(
        async (newlySelectedToken?: TokensWithRates) => {
            resetDraft();

            setValue(tokenInputName, newlySelectedToken?.contract || null, {
                shouldDirty: true,
            });
            setValue(amountInputName, '', {
                shouldDirty: true,
            });
            setValue(fiatInputName, '', {
                shouldDirty: true,
            });

            const isSetMaxActive = getDefaultValue('setMaxOutputId') === outputId;

            if (isSetMaxActive) {
                setMax(outputId, isSetMaxActive);
            }

            onModalClose();

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
            fiatInputName,
            getDefaultValue,
            onModalClose,
            outputId,
            resetDraft,
            setAmount,
            setMax,
            setValue,
            toggleOption,
            tokenInputName,
        ],
    );

    const renderItem = useCallback(
        (item: AssetPickerListItem) => {
            switch (item.type) {
                case 'account':
                    return (
                        <AssetRowAccountWithBalance
                            dataTestId={`@asset-picker/send-token/option/${item.account.symbol}`}
                            account={item.account}
                            onClick={() => handleSelectChange()}
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
                        <ExpandableAssetRowGroup
                            label="TR_HIDDEN_TOKENS"
                            account={item.account}
                            items={item.tokens.map(token => createTokenOption(item.account, token))}
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
                            height={item.height}
                            onExpandToggle={expanded => {
                                toggleGroup(item.account.key, expanded);
                            }}
                            dataTestId={`@asset-picker/send-token/option/hidden-tokens/${item.account.symbol}`}
                        />
                    );

                case 'group-label':
                case 'group-space':
                case 'low-balance-group':
                case 'non-tradable-group':
                    return null;
            }
        },
        [handleSelectChange, toggleGroup],
    );

    return (
        <AssetsModal heading={{ id: 'TR_SELECT_TOKEN' }} onClose={onModalClose}>
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
                isEmpty={filteredOptions.length === 0}
                heading="TR_TOKEN_NOT_FOUND"
                description={search ? 'TR_TOKEN_TRY_DIFFERENT_SEARCH' : undefined}
                height={LIST_HEIGHT}
            >
                <AssetsList
                    items={filteredOptions}
                    renderItem={renderItem}
                    height={LIST_HEIGHT}
                    ref={listRef}
                />
            </AssetsListEmpty>
        </AssetsModal>
    );
}
