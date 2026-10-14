import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { IconButton, Row } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { CaretLeftIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

import { BasicName } from './BasicName';

export const HiddenTokensName = () => {
    const { dispatch } = useServices(injectDispatch);

    return (
        <Row alignItems="center" gap={16}>
            <IconButton
                icon={CaretLeftIcon}
                intent="neutral"
                priority="secondary"
                size="large"
                onClick={() => dispatch(gotoThunk({ routeName: 'suite-index' }))}
                data-testid="@hidden-tokens/back"
                tooltip={{ content: <Translation id="TR_BACK" /> }}
            />
            <BasicName>
                <Translation id="TR_HIDDEN_TOKENS" />
            </BasicName>
        </Row>
    );
};
