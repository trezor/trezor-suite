import { Banner, H4, Column } from '@trezor/components';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { Translation } from 'src/components/suite';
import { hideCoinjoinReceiveWarning } from 'src/actions/suite/suiteActions';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

export const CoinjoinReceiveWarning = () => {
    const account = useSelector(selectSelectedAccount);
    const dispatch = useDispatch();

    if (!account) {
        return null;
    }

    return (
        <Banner
            icon
            rightContent={
                <Banner.Button onClick={() => dispatch(hideCoinjoinReceiveWarning())}>
                    <Translation id="TR_GOT_IT" />
                </Banner.Button>
            }
        >
            <H4>
                <Translation id="TR_COINJOIN_RECEIVE_WARNING_TITLE" />
            </H4>
            <Column>
                <Translation id="TR_COINJOIN_CEX_WARNING" />
                <Translation id="TR_UNECO_COINJOIN_RECEIVE_WARNING" />
            </Column>
        </Banner>
    );
};
