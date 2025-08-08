import { Account } from '@suite-common/wallet-types';
import { Box, Column, ElevationContext, Input, Modal, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { AccountList } from './AccountList';
import { useAccountSearch, useTranslation } from '../../../../../../hooks/suite';
import { AccountItemType } from '../../../../../../types/wallet';

type GlobalSendReceiveModalBaseProps = {
    heading?: React.ReactNode;
    onCancel: () => void;
    onSubmit: (account: Account, type: AccountItemType) => void;
    additionalAction?: React.ReactNode;
};

export const GlobalSendReceiveModalBase = ({
    heading,
    onCancel,
    onSubmit,
    additionalAction,
}: GlobalSendReceiveModalBaseProps) => {
    const { searchString, setSearchString } = useAccountSearch();
    const { translationString } = useTranslation();

    return (
        <Modal heading={heading} onCancel={onCancel} size="small">
            <Column height={500} gap={spacings.sm}>
                <Row gap={spacings.xs}>
                    <Box flex="1">
                        <Input
                            placeholder={translationString('TR_SEARCH')}
                            size="small"
                            value={searchString}
                            onChange={event => setSearchString(event.target.value)}
                        />
                    </Box>
                    {additionalAction}
                </Row>
                <ElevationContext baseElevation={-1}>
                    <AccountList hideStaking onSubmit={onSubmit} />
                </ElevationContext>
            </Column>
        </Modal>
    );
};
