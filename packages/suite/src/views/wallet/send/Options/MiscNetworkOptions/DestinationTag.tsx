import { Translation, useTranslation } from '@suite/intl';
import { formInputsMaxLength } from '@suite-common/validators';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { U_INT_32 } from '@suite-common/wallet-constants';
import { isInteger } from '@suite-common/wallet-utils';
import { Banner, Button, Column, Input, Note, Row, Switch } from '@trezor/components';
import { spacings } from '@trezor/theme';
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

    if (networkType !== 'ripple' && networkType !== 'stellar' && networkType !== 'solana') {
        return null;
    }

    const options = getDefaultValue('options', []);
    const destinationEnabled = options.includes('destinationTag');

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

    let destinationTagMaxLength;
    if (networkType === 'ripple') {
        destinationTagMaxLength = formInputsMaxLength.xrpDestinationTag;
    } else if (networkType === 'stellar') {
        destinationTagMaxLength = formInputsMaxLength.stellarTextMemo;
    } else if (networkType === 'solana') {
        destinationTagMaxLength = formInputsMaxLength.solanaMemo;
    }

    return (
        <Column gap={spacings.md}>
            <Row justifyContent="space-between">
                <Switch
                    isChecked={destinationEnabled}
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
            {destinationEnabled ? (
                <>
                    <Input
                        hasError={!!error}
                        data-testid={inputName}
                        defaultValue={inputValue}
                        maxLength={destinationTagMaxLength}
                        label={<Translation id="DESTINATION_TAG" />}
                        bottomText={error?.message || null}
                        innerRef={inputRef}
                        {...inputField}
                    />
                    <Note gap={spacings.xs}>
                        <Translation id="DESTINATION_TAG_NOTE" />
                    </Note>
                </>
            ) : (
                <Banner
                    intent="warning"
                    icon="warning"
                    description={
                        <Translation
                            id="DESTINATION_TAG_BANNER_SEND"
                            values={{ networkName: name }}
                        />
                    }
                />
            )}
        </Column>
    );
};
