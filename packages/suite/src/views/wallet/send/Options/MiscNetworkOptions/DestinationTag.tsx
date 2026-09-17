import { useEffect } from 'react';

import { Translation, useTranslation } from '@suite/intl';
import { formInputsMaxLength } from '@suite-common/validators';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { U_INT_32 } from '@suite-common/wallet-constants';
import { findToken, isInteger, isStellarContractToken } from '@suite-common/wallet-utils';
import { Banner, Button, Card, Column, Input, Note, Row, Switch } from '@trezor/components';
import { WarningIcon } from '@trezor/icons';
import { BigNumber } from '@trezor/utils';

import { useGuideOpenNode } from 'src/hooks/guide';
import { useSendFormContext } from 'src/hooks/wallet';

export const DESTINATION_TAG_GUIDE_PATH =
    '/3_send-and-receive/transactions-in-depth/destination-tags.md';

interface DestinationTagProps {
    networkSymbol: NetworkSymbol;
}

export const DestinationTag = ({ networkSymbol }: DestinationTagProps) => {
    const {
        account,
        watch,
        register,
        getDefaultValue,
        toggleOption,
        formState: { errors },
        composeTransaction,
        resetDefaultValue,
    } = useSendFormContext();

    const { translationString } = useTranslation();
    const { openNodeById } = useGuideOpenNode();

    const { networkType, name } = getNetwork(networkSymbol);

    const options = getDefaultValue('options', []);
    const destinationEnabled = options.includes('destinationTag');

    const selectedToken = findToken(account.tokens, watch('outputs.0.token'));
    // A contract token moves in a Soroban transaction, which the network rejects with a memo.
    const isSorobanTransfer =
        networkType === 'stellar' && !!selectedToken && isStellarContractToken(selectedToken);

    useEffect(() => {
        if (isSorobanTransfer && destinationEnabled) {
            resetDefaultValue('destinationTag');
            toggleOption('destinationTag');
            composeTransaction();
        }
    }, [
        isSorobanTransfer,
        destinationEnabled,
        resetDefaultValue,
        toggleOption,
        composeTransaction,
    ]);

    if (networkType !== 'ripple' && networkType !== 'stellar') {
        return null;
    }

    const inputName = 'destinationTag';
    const inputValue = getDefaultValue(inputName) || '';
    const error = errors[inputName];
    const { ref: inputRef, ...inputField } = register(inputName, {
        onChange: () => composeTransaction(inputName),
        required: translationString('DESTINATION_TAG_NOT_SET'),
        validate: (value = '') => {
            if (networkType === 'ripple') {
                const amountBig = new BigNumber(value);
                if (amountBig.isNaN()) {
                    return translationString('DESTINATION_TAG_IS_NOT_NUMBER');
                }
                if (!isInteger(value) || amountBig.lt(0) || amountBig.gt(U_INT_32)) {
                    return translationString('DESTINATION_TAG_IS_NOT_VALID');
                }
            }
        },
    });

    const handleToggleOption = () => {
        if (destinationEnabled) {
            resetDefaultValue('destinationTag');
        }

        toggleOption('destinationTag');
        composeTransaction();
    };

    const handleOpenGuide = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        openNodeById(DESTINATION_TAG_GUIDE_PATH);
    };

    const memoInput = (
        <>
            <Input
                hasError={!!error}
                data-testid={inputName}
                defaultValue={inputValue}
                maxLength={
                    networkType === 'ripple'
                        ? formInputsMaxLength.xrpDestinationTag
                        : formInputsMaxLength.stellarTextMemo
                }
                label={<Translation id="DESTINATION_TAG" />}
                bottomText={error?.message || null}
                innerRef={inputRef}
                {...inputField}
            />
            <Note gap={8}>
                <Translation id="DESTINATION_TAG_NOTE" />
            </Note>
        </>
    );

    const memoField = isSorobanTransfer ? (
        <Note gap={8}>
            <Translation id="TR_STELLAR_CONTRACT_TOKEN_MEMO_UNAVAILABLE" />
        </Note>
    ) : (
        <Banner
            intent="warning"
            icon={WarningIcon}
            description={
                <Translation id="DESTINATION_TAG_BANNER_SEND" values={{ networkName: name }} />
            }
        />
    );

    return (
        <Card>
            <Column gap={16}>
                <Row justifyContent="space-between">
                    <Switch
                        isChecked={destinationEnabled}
                        isDisabled={isSorobanTransfer}
                        onChange={handleToggleOption}
                        label={<Translation id="DESTINATION_TAG_SWITCH" />}
                    />
                    <Button
                        intent="neutral"
                        priority="secondary"
                        type="button"
                        size="small"
                        onClick={handleOpenGuide}
                    >
                        <Translation id="DESTINATION_TAG_GUIDE_LINK" />
                    </Button>
                </Row>
                {destinationEnabled && !isSorobanTransfer ? memoInput : memoField}
            </Column>
        </Card>
    );
};
