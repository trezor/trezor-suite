import styled, { css } from 'styled-components';

import { Translation, Modal } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { Button, CoinLogo, H3, Image, variables } from '@trezor/components';
import { onCancel } from 'src/actions/suite/modalActions';
import { Account } from '@suite-common/wallet-types';
import { networks } from '@suite-common/wallet-config';
import { TranslationKey } from 'src/components/suite/Translation';
import { SUITE } from 'src/actions/suite/constants';
import { spacingsPx } from '@trezor/theme';

const StyledImage = styled(Image)`
    width: 100%;
    height: 100%;
    align-self: center;
`;

const StyledModal = styled(Modal)`
    width: 390px;
`;

const StyledButton = styled(Button)`
    flex-grow: 1;
    margin-top: ${spacingsPx.xxl};
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
`;

const Title = styled(H3)`
    margin-bottom: ${spacingsPx.xs};
    text-align: left;
`;

const Description = styled.span`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: 500;
    line-height: 20px;
    text-align: left;
`;

const ImageWrapper = styled.div`
    position: relative;
    margin-bottom: ${spacingsPx.xxl};
`;

const ImageCoinLogoCommon = styled(CoinLogo)`
    position: absolute;
    width: auto;

    div {
        width: 100%;
        height: 100%;
    }

    svg {
        width: 100%;
        height: 100%;
    }
`;

const ImageCoinLogoLeft = styled(ImageCoinLogoCommon)`
    top: 17%;
    left: 3.5%;
    height: 52%;

    ${({ symbol }) =>
        symbol === 'eth' &&
        css`
            top: 15.6%;
            left: 4.8%;
            height: 51%;
        `}
`;

const ImageCoinLogoRight = styled(ImageCoinLogoCommon)`
    top: 31%;
    right: 3.5%;
    height: 52%;
`;

export interface ConfirmNetworkExplanationModalProps {
    account: Account | undefined;
    route: 'wallet-receive' | 'wallet-send';
}

export const ConfirmEvmExplanationModal = ({
    account,
    route,
}: ConfirmNetworkExplanationModalProps) => {
    const dispatch = useDispatch();
    const close = () => {
        dispatch(onCancel());
        if (!account?.symbol) {
            return;
        }
        dispatch({
            type: SUITE.EVM_CONFIRM_EXPLANATION_MODAL,
            symbol: account?.symbol,
            route,
        });
    };
    const confirmExplanationModalClosed = useSelector(
        state => state.suite.evmSettings.confirmExplanationModalClosed,
    );

    if (!account) {
        return null;
    }

    const network = networks[account.symbol];
    const isVisible =
        account.empty &&
        network.networkType === 'ethereum' &&
        account.symbol === 'matic' && // TODO: POLYGON DEBUG
        !confirmExplanationModalClosed[account.symbol]?.[route];

    if (!isVisible) {
        return null;
    }

    const titleTranslationsIds: Record<typeof route, TranslationKey> = {
        'wallet-receive': 'TR_CONFIRM_EVM_EXPLANATION_RECEIVE_TITLE',
        'wallet-send': 'TR_CONFIRM_EVM_EXPLANATION_SEND_TITLE',
    };

    const descriptionTranslationsIds: Record<typeof route, TranslationKey> = {
        'wallet-receive':
            account.symbol === 'eth'
                ? 'TR_CONFIRM_EVM_EXPLANATION_RECEIVE_DESCRIPTION_ETH'
                : 'TR_CONFIRM_EVM_EXPLANATION_RECEIVE_DESCRIPTION_OTHER',
        'wallet-send': 'TR_CONFIRM_EVM_EXPLANATION_SEND_DESCRIPTION',
    };

    return (
        <StyledModal headerComponent={null}>
            <Content>
                <ImageWrapper>
                    <StyledImage
                        image={
                            account.symbol === 'eth'
                                ? 'CONFIRM_EVM_EXPLANATION_ETH'
                                : 'CONFIRM_EVM_EXPLANATION_OTHER'
                        }
                    />
                    <ImageCoinLogoLeft symbol={account.symbol} />
                    {account.symbol !== 'eth' && <ImageCoinLogoRight symbol="eth" />}
                </ImageWrapper>
                <Title>
                    <Translation
                        id={titleTranslationsIds[route]}
                        values={{
                            network: network.name,
                        }}
                    />
                </Title>
                <Description>
                    <Translation
                        id={descriptionTranslationsIds[route]}
                        values={{
                            network: network.name,
                        }}
                    />
                </Description>
                <StyledButton variant="primary" onClick={close}>
                    <Translation id="TR_CONFIRM" />
                </StyledButton>
            </Content>
        </StyledModal>
    );
};
