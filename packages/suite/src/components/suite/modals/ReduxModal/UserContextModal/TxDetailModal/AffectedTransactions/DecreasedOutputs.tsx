import { NetworkSymbol } from '@suite-common/wallet-config';
import { Account, FormState } from '@suite-common/wallet-types';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import {
    Banner,
    Card,
    Column,
    Divider,
    Icon,
    Link,
    RadioCard,
    Row,
    Text,
} from '@trezor/components';
import { spacings } from '@trezor/theme';
import { HELP_CENTER_REPLACE_BY_FEE_BITCOIN } from '@trezor/urls';

import { Address, FormattedCryptoAmount, HiddenPlaceholder } from 'src/components/suite';
import { Translation, TranslationKey } from 'src/components/suite/Translation';
import { RbfContextValues, useRbfContext } from 'src/hooks/wallet/useRbfForm';

type AmountRowProps = {
    labelTranslationKey: TranslationKey;
    shouldSendInSats: boolean | undefined;
    amount: string;
    symbol: NetworkSymbol;
};

const AmountItem = ({ labelTranslationKey, shouldSendInSats, amount, symbol }: AmountRowProps) => {
    const value = shouldSendInSats ? formatNetworkAmount(amount, symbol) : amount;

    return (
        <Column>
            <Text variant="tertiary" typographyStyle="label">
                <Translation id={labelTranslationKey} />
            </Text>
            <FormattedCryptoAmount value={value} symbol={symbol} />
        </Column>
    );
};

type ReducedAmount = {
    composedLevels: RbfContextValues['composedLevels'];
    setMaxOutputId: number;
    account: Account;
    selectedFee: FormState['selectedFee'];
};

const ReducedAmount = ({ composedLevels, setMaxOutputId, account, selectedFee }: ReducedAmount) => {
    if (!composedLevels) {
        return null;
    }

    const precomposedTx = composedLevels[selectedFee || 'normal'];

    if (precomposedTx?.type !== 'final') {
        return null;
    }

    return (
        <>
            <Icon name="arrowRight" />
            <AmountItem
                labelTranslationKey="TR_RBF_NEW_AMOUNT"
                amount={precomposedTx.outputs[setMaxOutputId].amount.toString()}
                symbol={account.symbol}
                shouldSendInSats={true} // precomposedTx.outputs is always in Sats
            />
        </>
    );
};

export const DecreasedOutputs = () => {
    const {
        showDecreasedOutputs,
        formValues,
        account,
        coinjoinRegisteredUtxos,
        getValues,
        setValue,
        composedLevels,
        composeRequest,
        shouldSendInSats,
    } = useRbfContext();
    const { selectedFee, setMaxOutputId } = getValues();

    // no set-max means that no output was decreased
    if (!showDecreasedOutputs || typeof setMaxOutputId !== 'number') return null;

    // find all outputs possible to reduce
    const useRadio = formValues.outputs.filter(o => typeof o.address === 'string').length > 1;

    const getDecreaseWarring = (): TranslationKey => {
        if (account.accountType === 'coinjoin') {
            if (coinjoinRegisteredUtxos.length > 0) {
                return 'TR_UTXO_REGISTERED_IN_COINJOIN_RBF_WARNING';
            } else {
                return 'TR_NOT_ENOUGH_ANONYMIZED_FUNDS_RBF_WARNING';
            }
        }

        return 'TR_DECREASE_TX';
    };

    return (
        <Card fillType="flat" paddingType="none">
            <Row justifyContent="space-between" alignItems="center" padding={spacings.md}>
                <Text typographyStyle="body">
                    <Translation id="TR_AMOUNT_REDUCED_TXS" />
                </Text>
                <Text variant="primary" typographyStyle="hint">
                    <Link
                        icon="arrowUpRight"
                        variant="nostyle"
                        href={HELP_CENTER_REPLACE_BY_FEE_BITCOIN}
                    >
                        <Translation id="TR_LEARN_MORE" />
                    </Link>
                </Text>
            </Row>

            <Divider margin={spacings.zero} />
            <Column margin={spacings.md} gap={spacings.md}>
                <Banner variant="warning" data-testid="@send/decreased-outputs" icon="warning">
                    <Translation id={getDecreaseWarring()} />
                </Banner>
                {useRadio && (
                    <Text>
                        <Translation id="TR_DECREASED_AMOUNT_SELECTION_EXPLANATION" />
                    </Text>
                )}
                <Column gap={spacings.md} alignItems="center">
                    {formValues.outputs.flatMap((output, i) => {
                        if (typeof output.address !== 'string') return null;
                        const isChecked = setMaxOutputId === i;

                        return (
                            // it's safe to use array index as key since outputs do not change
                            <RadioCard
                                key={i}
                                onClick={
                                    useRadio
                                        ? () => {
                                              setValue('setMaxOutputId', i);
                                              composeRequest();
                                          }
                                        : undefined
                                }
                                isActive={useRadio && isChecked}
                            >
                                <Row gap={spacings.sm}>
                                    <AmountItem
                                        labelTranslationKey="TR_RBF_ORIGINAL_AMOUNT"
                                        amount={output.amount}
                                        symbol={account.symbol}
                                        shouldSendInSats={shouldSendInSats}
                                    />
                                    {isChecked && (
                                        <ReducedAmount
                                            account={account}
                                            selectedFee={selectedFee}
                                            composedLevels={composedLevels}
                                            setMaxOutputId={setMaxOutputId}
                                        />
                                    )}
                                    <Column margin={{ left: 'auto' }}>
                                        <Text variant="tertiary" typographyStyle="label">
                                            <Translation id="TR_RECIPIENT_ADDRESS" />
                                        </Text>
                                        <HiddenPlaceholder>
                                            <Address value={output.address} isTruncated />
                                        </HiddenPlaceholder>
                                    </Column>
                                </Row>
                            </RadioCard>
                        );
                    })}
                </Column>
            </Column>
        </Card>
    );
};
