import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite/useDispatch';
import { H2, Paragraph, Card, Checkbox, NewModal } from '@trezor/components';
import {
    DefinitionType,
    tokenDefinitionsActions,
    TokenManagementAction,
} from '@suite-common/token-definitions';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { useSelector } from 'src/hooks/suite';
import { useState } from 'react';
import { spacings } from '@trezor/theme';
import { setFlag } from 'src/actions/suite/suiteActions';

interface UnhideTokenModalProps {
    address: string;
    onCancel: () => void;
}

export const UnhideTokenModal = ({ address, onCancel }: UnhideTokenModalProps) => {
    const [checked, setChecked] = useState(false);

    const account = useSelector(selectSelectedAccount);
    const dispatch = useDispatch();

    if (!account) return null;

    const onUnhide = () => {
        if (checked) {
            dispatch(setFlag('showUnhideTokenModal', false));
        }
        dispatch(
            tokenDefinitionsActions.setTokenStatus({
                networkSymbol: account.symbol,
                contractAddress: address,
                status: TokenManagementAction.SHOW,
                type: DefinitionType.COIN,
            }),
        );
        onCancel();
    };

    return (
        <NewModal
            onCancel={onCancel}
            icon="warning"
            variant="warning"
            bottomContent={
                <>
                    <NewModal.Button onClick={onUnhide}>
                        <Translation id="TR_UNHIDE" />
                    </NewModal.Button>
                    <NewModal.Button variant="tertiary" onClick={onCancel}>
                        <Translation id="TR_CANCEL" />
                    </NewModal.Button>
                </>
            }
        >
            <H2>
                <Translation id="TR_UNHIDE_TOKEN_TITLE" />
            </H2>
            <Paragraph variant="tertiary" margin={{ top: spacings.xs }}>
                <Translation id="TR_UNHIDE_TOKEN_TEXT" />
            </Paragraph>
            <Card margin={{ top: spacings.xl }}>
                <Checkbox isChecked={checked} onClick={() => setChecked(!checked)}>
                    <Translation id="TR_DO_NOT_SHOW_AGAIN" />
                </Checkbox>
            </Card>
        </NewModal>
    );
};
