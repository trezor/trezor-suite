import { useEffect, useState } from 'react';

import { Translation, useTranslation } from '@suite/intl';
import { selectIsDebugModeActive, selectLanguage } from '@suite/settings';
import { formInputsMaxLength } from '@suite-common/validators';
import { ethereumGetCurrentNonceThunk } from '@suite-common/wallet-core/src/send/sendFormEthereumThunks';
import { type Account, type FormState } from '@suite-common/wallet-types';
import { isInteger } from '@suite-common/wallet-utils';
import { Row, Text } from '@trezor/components';
import { NumberInput } from '@trezor/product-components';
import { BigNumber } from '@trezor/utils';

import { DebugOnlyBadge } from 'src/components/suite/DebugOnlyBadge';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useSendFormContext } from 'src/hooks/wallet';

export const EthereumNonce = () => {
    const {
        control,
        formState: { errors },
        account,
        composeTransaction,
    } = useSendFormContext();

    const isDebug = useSelector(selectIsDebugModeActive);
    const locale = useSelector(selectLanguage);
    const { translationString } = useTranslation();
    const dispatch = useDispatch();

    const isEthereum = account.networkType === 'ethereum';
    const [displayNonce, setDisplayNonce] = useState<string>();

    useEffect(() => {
        if (account.networkType !== 'ethereum') return;

        // Resolve the same nonce signing will use (live node fetch + pending-tx adjustment)
        // instead of the potentially-stale store value, so the value shown here matches the
        // signing-time validation.
        const promise = dispatch(
            ethereumGetCurrentNonceThunk({
                selectedAccount: account as Account & { networkType: 'ethereum' },
            }),
        );

        void promise
            .unwrap()
            .then(result => setDisplayNonce(result.nonce))
            .catch(() => {});

        return () => {
            promise.abort();
        };
    }, [account, dispatch]);

    if (!isEthereum) return null;

    if (!isDebug) {
        return (
            <Row justifyContent="space-between">
                <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                    <Translation id="TR_NONCE" />
                    {': '}
                </Text>
                <Text intent="neutral" typographyStyle="body-sm">
                    {displayNonce}
                </Text>
            </Row>
        );
    }

    const rules = {
        validate: (value: string | undefined) => {
            if (!value) return;

            const nonceBig = new BigNumber(value);

            if (!isInteger(value)) {
                return translationString('ETHEREUM_NONCE_IS_NOT_INTEGER');
            }
            if (nonceBig.lt(0)) {
                return translationString('ETHEREUM_NONCE_IS_TOO_LOW');
            }
        },
    };

    const error = errors.ethereumNonce;

    return (
        <NumberInput
            control={control}
            name={'ethereumNonce' satisfies keyof FormState}
            locale={locale}
            hasError={!!error}
            onChange={() => composeTransaction()}
            rules={rules}
            maxLength={formInputsMaxLength.ethereumNonce}
            placeholder={displayNonce}
            bottomText={error?.message || null}
            labelLeft={
                <DebugOnlyBadge>
                    <Text typographyStyle="body-sm">
                        <Translation id="TR_NONCE" />
                    </Text>
                </DebugOnlyBadge>
            }
            data-testid="ethereum-nonce-input"
        />
    );
};
