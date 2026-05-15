import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor } from '@suite/router';
import {
    selectUseFiatBasedCryptoDecimals,
    setUseFiatBasedCryptoDecimals,
} from '@suite-common/wallet-core';
import { Switch } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { useDispatch, useSelector } from 'src/hooks/suite';

export const FiatBasedCryptoDecimals = () => {
    const dispatch = useDispatch();
    const isEnabled = useSelector(selectUseFiatBasedCryptoDecimals);

    const handleChange = () => {
        dispatch(setUseFiatBasedCryptoDecimals(!isEnabled));
    };

    return (
        <Anchor anchorId={SettingsAnchor.FiatBasedCryptoDecimals}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
                >
                    <TextColumn
                        title={<Translation id="TR_FIAT_BASED_CRYPTO_DECIMALS" />}
                        description={<Translation id="TR_FIAT_BASED_CRYPTO_DECIMALS_DESCRIPTION" />}
                    />
                    <ActionColumn>
                        <Switch
                            isChecked={isEnabled}
                            onChange={handleChange}
                            data-testid="@settings/fiat-based-crypto-decimals-switch"
                        />
                    </ActionColumn>
                </SectionItem>
            )}
        </Anchor>
    );
};
