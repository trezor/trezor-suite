import { Translation } from '@suite/intl';
import { CardList, Icon, Row, Text } from '@trezor/components';
import { ProhibitIcon } from '@trezor/icons';

export const TradingOffersModalGroupEmpty = () => (
    <CardList.Item data-testid="@trading/offers/group-empty">
        <Row gap={8} alignItems="center">
            <Icon as={ProhibitIcon} size={20} intent="neutral" priority="secondary" />
            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                <Translation id="TR_NO_OFFERS_AVAILABLE" />
            </Text>
        </Row>
    </CardList.Item>
);
