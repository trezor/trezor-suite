import { useMemo, useState } from 'react';

import { updateFiatRatesThunk } from '@suite-common/wallet-core';
import { Timestamp, TokenAddress } from '@suite-common/wallet-types';
import { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import {
    AssetOptionBaseProps,
    SearchAsset,
    SelectAssetModal,
    TokenTab,
    TokenTabs,
} from '@trezor/product-components';

import { Translation } from 'src/components/suite/Translation';
import { TokenBalance } from 'src/components/wallet/TokenBalance';
import { useDispatch, useTranslation } from 'src/hooks/suite';
import { useSendFormContext } from 'src/hooks/wallet';
import { getFingerprint } from 'src/utils/wallet/getFingerprint';

import { useBuildOptionsForTabs } from './hooks/useBuildOptionsForTabs';
import { useOptionsSearch } from './hooks/useOptionsSearch';

interface SelectTokenAssetModalProps {
    onModalClose: () => void;
    outputId: number;
    tokenInputName: `outputs.${number}.token`;
}

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

    const [activeTokenTab, setActiveTokenTab] = useState<TokenTab['tab']>('tokens');

    const dataEnabled = getDefaultValue('options', []).includes('transactionData');

    const amountInputName = `outputs.${outputId}.amount` as const;
    const fiatInputName = `outputs.${outputId}.fiat` as const;
    const currencyInputName = `outputs.${outputId}.currency` as const;

    const currencyValue = watch(currencyInputName);

    const optionsForAllTabs = useBuildOptionsForTabs(account);
    const { filteredOptions, setSearch, search } = useOptionsSearch(
        optionsForAllTabs[activeTokenTab],
    );
    const optionsFingerprint = useMemo(
        () =>
            getFingerprint(
                filteredOptions.map(
                    ({ badge, ...optionWithoutReactNodes }) => optionWithoutReactNodes,
                ),
            ),
        [filteredOptions],
    );

    const handleSelectChange = async (selectedAsset: AssetOptionBaseProps) => {
        const newlySelectedToken = account.tokens?.find(
            token => token.contract === selectedAsset.contractAddress,
        );

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
                    },
                ],
                baseCurrencyCode: currencyValue.value as BaseCurrencyCode,
                rateType: 'current',
                fetchAttemptTimestamp: Date.now() as Timestamp,
            }),
        );
        // clear errors in Amount input
        clearErrors(amountInputName);
        // remove Amount if isSetMaxActive or ETH data options are enabled
        if (isSetMaxActive || dataEnabled) setAmount(outputId, '');
        // remove ETH data option
        if (dataEnabled) toggleOption('transactionData');
        // compose (could be prevented because of Amount error from re-validation above)
        composeTransaction(amountInputName);
    };

    return (
        <SelectAssetModal
            options={filteredOptions}
            optionsFingerprint={optionsFingerprint}
            onSelectAsset={handleSelectChange}
            onClose={onModalClose}
            searchInput={
                <SearchAsset
                    searchPlaceholder={translationString('TR_SEARCH_TOKEN_IN_SEND_FORM_MODAL')}
                    search={search}
                    setSearch={setSearch}
                />
            }
            noItemsAvailablePlaceholder={{
                heading: <Translation id="TR_TOKEN_NOT_FOUND" />,
                body: search ? <Translation id="TR_TOKEN_TRY_DIFFERENT_SEARCH" /> : undefined,
            }}
            filterTabs={
                <TokenTabs
                    tabs={[
                        {
                            tab: 'tokens',
                            label: <Translation id="TR_TOKENS" />,
                        },
                        {
                            tab: 'hidden',
                            label: <Translation id="TR_HIDDEN" />,
                        },
                    ]}
                    activeTokenTab={activeTokenTab}
                    setActiveTokenTab={setActiveTokenTab}
                />
            }
            renderOptionBalance={option =>
                option.tokenBalance && option.contractAddress ? (
                    <TokenBalance
                        contractAddress={option.contractAddress}
                        tokenBalance={option.tokenBalance}
                    />
                ) : null
            }
        />
    );
}
