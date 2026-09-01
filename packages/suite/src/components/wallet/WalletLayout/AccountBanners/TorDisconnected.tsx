import { useDispatch } from 'react-redux';

import { selectSelectedAccount } from '@suite/account';
import { Translation } from '@suite/intl';
import { selectIsTorEnabled, selectIsTorLoading } from '@suite/tor';
import { toggleTor } from '@suite/tor-desktop';
import { Banner } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

export const TorDisconnected = () => {
    const account = useSelector(selectSelectedAccount);
    const isTorEnabled = useSelector(selectIsTorEnabled);
    const isTorLoading = useSelector(selectIsTorLoading);
    const dispatch = useDispatch();

    if (account?.accountType !== 'coinjoin' || isTorEnabled) return null;

    const handleButtonClick = () => dispatch(toggleTor(true));

    return (
        <Banner
            intent="warning"
            rightContent={
                <Banner.Button onClick={handleButtonClick} isLoading={isTorLoading}>
                    {isTorLoading ? (
                        <Translation id="TR_ENABLING_TOR" />
                    ) : (
                        <Translation id="TR_TOR_ENABLE" />
                    )}
                </Banner.Button>
            }
            description={
                <Translation
                    id="TR_TOR_REQUEST_ENABLE_FOR_COIN_JOIN_TITLE"
                    values={{
                        b: chunks => <b>{chunks}</b>,
                    }}
                />
            }
        />
    );
};
