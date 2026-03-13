import { useState } from 'react';

import { setFlag } from '@suite/flags';
import { Translation } from '@suite/intl';
import {
    DefinitionType,
    TokenManagementAction,
    tokenDefinitionsActions,
} from '@suite-common/token-definitions';
import { Card, Checkbox, H2, Modal, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
import { useDispatch } from 'src/hooks/suite/useDispatch';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

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
            dispatch(setFlag({ key: 'showUnhideTokenModal', value: false }));
        }
        dispatch(
            tokenDefinitionsActions.setTokenStatus({
                symbol: account.symbol,
                contractAddress: address,
                status: TokenManagementAction.SHOW,
                type: DefinitionType.COIN,
            }),
        );
        onCancel();
    };

    return (
        <Modal
            onCancel={onCancel}
            iconName="warning"
            intent="warning"
            bottomContent={
                <>
                    <Modal.Button onClick={onUnhide}>
                        <Translation id="TR_UNHIDE" />
                    </Modal.Button>
                    <Modal.Button intent="neutral" priority="secondary" onClick={onCancel}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            <H2>
                <Translation id="TR_UNHIDE_TOKEN_TITLE" />
            </H2>
            <Paragraph intent="neutral" priority="secondary" margin={{ top: spacings.xs }}>
                <Translation id="TR_UNHIDE_TOKEN_TEXT" />
            </Paragraph>
            <Card margin={{ top: spacings.xl }}>
                <Checkbox isChecked={checked} onChange={() => setChecked(!checked)}>
                    <Translation id="TR_DO_NOT_SHOW_AGAIN" />
                </Checkbox>
            </Card>
        </Modal>
    );
};
