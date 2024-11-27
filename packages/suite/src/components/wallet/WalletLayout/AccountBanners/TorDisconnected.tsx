import { Banner } from '@trezor/components';

import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { toggleTor } from 'src/actions/suite/suiteActions';
import { selectTorState } from 'src/reducers/suite/suiteReducer';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

export const TorDisconnected = () => {
    const account = useSelector(selectSelectedAccount);
    const { isTorEnabled, isTorLoading } = useSelector(selectTorState);
    const dispatch = useDispatch();

    if (account?.accountType !== 'coinjoin' || isTorEnabled) return null;

    const handleButtonClick = () => dispatch(toggleTor(true));

    return (
        <Banner
            variant="warning"
            rightContent={
                <Banner.Button onClick={handleButtonClick} isLoading={isTorLoading}>
                    {isTorLoading ? (
                        <Translation id="TR_ENABLING_TOR" />
                    ) : (
                        <Translation id="TR_TOR_ENABLE" />
                    )}
                </Banner.Button>
            }
        >
            <Translation
                id="TR_TOR_REQUEST_ENABLE_FOR_COIN_JOIN_TITLE"
                values={{
                    b: chunks => <b>{chunks}</b>,
                }}
            />
        </Banner>
    );
};
