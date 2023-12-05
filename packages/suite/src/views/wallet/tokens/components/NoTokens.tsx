import { Button } from '@trezor/components';
import { AccountExceptionLayout } from 'src/components/wallet';
import { Translation } from 'src/components/suite';
import { openModal } from 'src/actions/suite/modalActions';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const NoTokens = () => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const dispatch = useDispatch();

    if (selectedAccount.status !== 'loaded') return null;

    const { account } = selectedAccount;

    const handleButtonClick = () => dispatch(openModal({ type: 'add-token' }));

    const allowAddToken = account.networkType !== 'cardano' && account.networkType !== 'solana';

    return (
        <AccountExceptionLayout
            title={<Translation id="TR_TOKENS_EMPTY" />}
            image="CLOUDY"
            actionComponent={
                allowAddToken ? (
                    <Button variant="primary" onClick={handleButtonClick}>
                        <Translation id="TR_TOKENS_ADD" />
                    </Button>
                ) : undefined
            }
        />
    );
};
