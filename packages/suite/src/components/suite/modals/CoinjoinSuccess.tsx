import React from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { Button, Icon, useTheme, variables } from '@trezor/components';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { WalletParams } from '@suite-common/wallet-types';
import { goto } from '@suite-actions/routerActions';
import { useSelector } from '@suite-hooks/useSelector';
import { selectRouterParams } from '@suite-reducers/routerReducer';
import { onCancel as closeModal } from '@suite-actions/modalActions';
import { Modal, Translation } from '..';

const StyledModal = styled(Modal)`
    width: 430px;
`;

const StyledButton = styled(Button)`
    flex: 1;
`;

const StyledIcon = styled(Icon)`
    width: 84px;
    height: 84px;
    margin: 12px auto 32px;
    border-radius: 50%;
    background: ${({ theme }) => theme.BG_GREY};
`;

const Heading = styled.h3`
    margin-bottom: 22px;
    font-size: 32px;
    line-height: 32px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_GREEN};
`;

interface CoinjoinSuccessProps {
    relatedAccountKey: string;
}

export const CoinjoinSuccess = ({ relatedAccountKey }: CoinjoinSuccessProps) => {
    const routerParams = useSelector(selectRouterParams);
    const relatedAccount = useSelector(state => selectAccountByKey(state, relatedAccountKey));

    const theme = useTheme();
    const dispatch = useDispatch();

    if (!relatedAccount) {
        return null;
    }

    const { symbol, index, accountType } = relatedAccount;

    const navigateToRelatedAccount = () => {
        dispatch(closeModal());
        dispatch(
            goto('wallet-index', {
                params: {
                    symbol,
                    accountIndex: index,
                    accountType,
                },
            }),
        );
    };

    const {
        symbol: symbolParam,
        accountIndex: indexParam,
        accountType: accountTypeParam,
    } = (routerParams as WalletParams) || {};

    const isOnAccountPage =
        symbolParam === symbol && indexParam === index && accountTypeParam === accountType;

    return (
        <StyledModal
            bottomBar={
                <>
                    <StyledButton variant="secondary" onClick={() => dispatch(closeModal())}>
                        <Translation id="TR_DISMISS" />
                    </StyledButton>
                    {!isOnAccountPage && (
                        <StyledButton onClick={navigateToRelatedAccount}>
                            <Translation id="TR_VIEW_ACCOUNT" />
                        </StyledButton>
                    )}
                </>
            }
        >
            <StyledIcon icon="CONFETTI_SUCCESS" size={32} color={theme.TYPE_GREEN} />

            <Heading>
                <Translation id="TR_COINJOIN_COMPLETED" />
            </Heading>
        </StyledModal>
    );
};
