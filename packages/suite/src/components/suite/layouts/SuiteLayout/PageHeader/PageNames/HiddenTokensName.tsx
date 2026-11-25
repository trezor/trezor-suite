import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { IconButton, Row } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { CaretLeftIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

import { BasicName } from './BasicName';

type HiddenTokensNameProps = {
    isAccountScoped?: boolean;
};

export const HiddenTokensName = ({ isAccountScoped = false }: HiddenTokensNameProps) => {
    const { dispatch } = useServices(injectDispatch);

    const goBack = () =>
        dispatch(
            isAccountScoped
                ? gotoThunk({ routeName: 'wallet-index', preserveParams: true })
                : gotoThunk({ routeName: 'suite-index' }),
        );

    return (
        <Row alignItems="center" gap={16}>
            <IconButton
                icon={CaretLeftIcon}
                intent="neutral"
                priority="secondary"
                size="large"
                onClick={goBack}
                data-testid="@hidden-tokens/back"
                tooltip={{ content: <Translation id="TR_BACK" /> }}
            />
            <BasicName>
                <Translation id="TR_HIDDEN_TOKENS" />
            </BasicName>
        </Row>
    );
};
