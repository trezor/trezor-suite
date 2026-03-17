import { useEffect, useMemo, useState } from 'react';

import { selectIsCopyAddressModalShown } from '@suite/flags';
import { Translation } from '@suite/intl';
import { selectIsSpecificCoinDefinitionKnown } from '@suite-common/token-definitions';
import {
    type Explorer,
    getCoingeckoId,
    getNetwork,
    getNetworkDisplaySymbolName,
} from '@suite-common/wallet-config';
import { selectExplorer } from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import {
    getContractAddressForNetworkSymbol,
    getTokenExplorerUrl,
    hasNetworkFeatures,
    isNftToken,
} from '@suite-common/wallet-utils';
import { Card, Column, IconButton, Link, Row, Text } from '@trezor/components';
import { AssetLogo, CoinLogo } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { copyAddressToClipboard, showCopyAddressModal } from 'src/actions/suite/copyAddressActions';
import { setSendFormPrefill } from 'src/actions/suite/suiteActions';
import {
    Address,
    BaseCurrencyValue,
    FormattedCryptoAmount,
    HiddenPlaceholder,
} from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useSendFormContext } from 'src/hooks/wallet';
import { getTokenAddressTranslationId } from 'src/utils/wallet/tokenUtils';

import { SelectTokenAssetModal } from './SelectTokenAssetModal/SelectTokenAssetModal';

type TokenSelectProps = {
    outputId: number;
};

export const TokenSelect = ({ outputId }: TokenSelectProps) => {
    const { account, setAmount, getValues, getDefaultValue, watch, setValue, setDraftSaveRequest } =
        useSendFormContext();

    const dispatch = useDispatch();

    const [isTokensModalActive, setIsTokensModalActive] = useState(false);

    const explorer = useSelector(state => selectExplorer(state, account.symbol)) as Explorer;
    const shouldShowCopyAddressModal = useSelector(selectIsCopyAddressModalShown);
    const sendFormPrefillContractAddress = useSelector(state => state.suite.prefillFields.sendForm);

    const tokenInputName = `outputs.${outputId}.token` as const;
    const tokenContractAddress = watch(tokenInputName);

    const isTokenKnown = useSelector(state =>
        selectIsSpecificCoinDefinitionKnown(
            state,
            account.symbol,
            (tokenContractAddress || '') as TokenAddress,
        ),
    );

    const isSetMaxActive = getDefaultValue('setMaxOutputId') === outputId;

    // Amount needs to be re-validated again AFTER token change propagation (decimal places, available balance)
    // watch token change and use "useSendFormFields.setAmount" utils for validation (if amount is set)
    // if Amount is not valid 'react-hook-form' will set an error to it, and composeTransaction will be prevented
    // N0TE: do this conditionally only for networks with tokens and when set-max is not enabled
    const tokenWatch = watch(tokenInputName, null);

    useEffect(() => {
        if (hasNetworkFeatures(account, 'tokens') && !isSetMaxActive) {
            const amountValue = getValues(`outputs.${outputId}.amount`) as string;
            if (amountValue) setAmount(outputId, amountValue);
        }
    }, [account, outputId, tokenWatch, setAmount, getValues, isSetMaxActive]);

    useEffect(() => {
        if (sendFormPrefillContractAddress) {
            setValue(tokenInputName, sendFormPrefillContractAddress, {
                shouldValidate: true,
                shouldDirty: true,
            });
            setDraftSaveRequest(true);

            return () => {
                dispatch(setSendFormPrefill({ contractAddress: undefined }));
            };
        }
    }, [sendFormPrefillContractAddress, setValue, tokenInputName, setDraftSaveRequest, dispatch]);

    const selectedToken = useMemo(
        () => account.tokens?.find(token => token.contract === tokenContractAddress),
        [account.tokens, tokenContractAddress],
    );

    const hasNoStandardTokens = !account.tokens?.filter(token => !isNftToken(token))?.length;
    const onOpenSelectAssetModal = !hasNoStandardTokens
        ? () => setIsTokensModalActive(true)
        : undefined;

    const networkTokenContractAddress =
        selectedToken && getContractAddressForNetworkSymbol(account.symbol, selectedToken.contract);

    return (
        <>
            {isTokensModalActive && (
                <SelectTokenAssetModal
                    onModalClose={() => setIsTokensModalActive(false)}
                    outputId={outputId}
                    tokenInputName={tokenInputName}
                />
            )}

            <Card fillType="default" paddingType="normal" onClick={onOpenSelectAssetModal}>
                <Row justifyContent="space-between" height={64}>
                    <Row justifyContent="flex-start" gap={spacings.sm}>
                        {selectedToken ? (
                            <AssetLogo
                                coingeckoId={getCoingeckoId(account.symbol)!}
                                symbol={account.symbol}
                                contractAddress={selectedToken?.contract}
                                size={24}
                                placeholder={selectedToken?.symbol || account.symbol}
                                placeholderWithTooltip={false}
                                shouldTryToFetch={isTokenKnown}
                            />
                        ) : (
                            <CoinLogo symbol={account.symbol} size={36} type="tokenWithNetwork" />
                        )}
                        <Column alignItems="flex-start">
                            <Row justifyContent="flex-start">
                                <Text intent="neutral" typographyStyle="body-md">
                                    {selectedToken?.name ||
                                        getNetworkDisplaySymbolName(account.symbol)}
                                </Text>
                            </Row>
                            <Row>
                                <Text
                                    intent="neutral"
                                    priority="secondary"
                                    typographyStyle="body-sm"
                                >
                                    <HiddenPlaceholder>
                                        <FormattedCryptoAmount
                                            value={
                                                selectedToken?.balance || account.formattedBalance
                                            }
                                            symbol={selectedToken?.symbol ?? account.symbol}
                                            contractAddress={selectedToken?.contract}
                                            data-testid={tokenInputName}
                                        />
                                    </HiddenPlaceholder>{' '}
                                    <BaseCurrencyValue
                                        tokenAddress={selectedToken?.contract as TokenAddress}
                                        amount={selectedToken?.balance || account.formattedBalance}
                                        symbol={account.symbol}
                                        showApproximationIndicator
                                    />
                                </Text>
                            </Row>
                            {networkTokenContractAddress && (
                                <Row justifyContent="flex-start">
                                    <Text
                                        intent="neutral"
                                        priority="secondary"
                                        typographyStyle="body-sm"
                                    >
                                        <Row gap={spacings.xxs}>
                                            <Translation
                                                id={getTokenAddressTranslationId(
                                                    account.networkType,
                                                )}
                                            />
                                            <Link
                                                href={getTokenExplorerUrl(
                                                    explorer,
                                                    getNetwork(account.symbol).networkType,
                                                    selectedToken,
                                                )}
                                                onClick={ev => ev.stopPropagation()}
                                            >
                                                <Address
                                                    isTruncated
                                                    value={networkTokenContractAddress}
                                                    typographyStyle="body-sm"
                                                    intent="neutral"
                                                    priority="secondary"
                                                    isCopyAllowed
                                                    onCopy={() => {
                                                        dispatch(
                                                            shouldShowCopyAddressModal
                                                                ? showCopyAddressModal(
                                                                      networkTokenContractAddress,
                                                                      'contract',
                                                                  )
                                                                : copyAddressToClipboard(
                                                                      networkTokenContractAddress,
                                                                  ),
                                                        );
                                                    }}
                                                />
                                            </Link>
                                        </Row>
                                    </Text>
                                </Row>
                            )}
                        </Column>
                    </Row>
                    {!hasNoStandardTokens && (
                        <IconButton icon="caretDown" intent="neutral" priority="secondary" />
                    )}
                </Row>
            </Card>
        </>
    );
};
