import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';
import { IconButton, Row } from '@trezor/components';
import { CaretLeftIcon } from '@trezor/icons';

import { BasicName } from './BasicName';

export const HiddenTokensName = () => {
    const { dispatch } = useServices(selectDispatch);

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
