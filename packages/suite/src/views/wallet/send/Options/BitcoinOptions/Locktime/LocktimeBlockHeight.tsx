import { type ReactElement } from 'react';

import { Translation, useTranslation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { BTC_LOCKTIME_VALUE } from '@suite-common/wallet-constants';
import { selectBlockchainHeightBySymbol } from '@suite-common/wallet-core';
import { isInteger, localizeNumber } from '@suite-common/wallet-utils';
import { Row, Text } from '@trezor/components';
import { NumberInput } from '@trezor/product-components';
import { BigNumber } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';
import { useSendFormContext } from 'src/hooks/wallet';

export const inputName = 'bitcoinLocktimeBlockHeight';

type LocktimeBlockHeightProps = {
    rightContent?: ReactElement;
};

export const LocktimeBlockHeight = ({ rightContent }: LocktimeBlockHeightProps) => {
    const {
        control,
        formState: { errors },
        composeTransaction,
        network,
    } = useSendFormContext();

    const error = errors[inputName];

    const { translationString } = useTranslation();

    const locale = useSelector(selectLanguage);

    const blockchainHeight = useSelector(state =>
        selectBlockchainHeightBySymbol(state, network.symbol),
    );

    const rules = {
        required: translationString('LOCKTIME_IS_NOT_SET'),
        validate: (value = '') => {
            const amountBig = new BigNumber(value);

            if (amountBig.lte(0)) {
                return translationString('LOCKTIME_IS_TOO_LOW');
            }
            if (!isInteger(value)) {
                return translationString('LOCKTIME_IS_NOT_INTEGER');
            }
            // Bigger numbers denote time, not number of blocks
            if (amountBig.gte(BTC_LOCKTIME_VALUE)) {
                return translationString('LOCKTIME_IS_TOO_BIG');
            }
        },
    };

    return (
        <NumberInput
            control={control}
            name={inputName}
            locale={locale}
            hasError={!!error}
            onChange={() => composeTransaction()}
            rules={rules}
            bottomText={
                <Row justifyContent="space-between" width="100%">
                    <Text>{error?.message || ''}</Text>
                    <Text intent="neutral" priority="secondary">
                        <Translation
                            id="LOCKTIME_CURRENT_BLOCKHEIGHT"
                            values={{ blockheight: localizeNumber(blockchainHeight, locale) }}
                        />
                    </Text>
                </Row>
            }
            labelLeft={
                <Text typographyStyle="body-sm">
                    <Translation id="LOCKTIME_DESCRIPTION" />
                </Text>
            }
            rightContent={rightContent}
            data-testid="locktime-blockheight-input"
        />
    );
};
