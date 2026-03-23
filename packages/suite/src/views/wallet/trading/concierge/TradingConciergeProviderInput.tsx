import { useEffect, useMemo, useState } from 'react';

import { Translation } from '@suite/intl';
import {
    type OtcProviderType,
    type TradingCountryCode,
    getOtcProvidersByCountry,
    useFetchOtc,
} from '@suite-common/trading';
import {
    Banner,
    CardList,
    Column,
    GhostContainer,
    Icon,
    Modal,
    Row,
    SkeletonRectangle,
    Text,
} from '@trezor/components';

type TradingConciergeProviderInputProps = {
    provider: OtcProviderType | null;
    country: TradingCountryCode;
    onProviderSelect: (provider: OtcProviderType | null) => void;
    isLoading?: boolean;
};

export const TradingConciergeProviderInput = ({
    provider,
    country,
    onProviderSelect,
    isLoading,
}: TradingConciergeProviderInputProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { data: otcData, isSuccess } = useFetchOtc();

    const providers = useMemo(
        () => (isSuccess ? getOtcProvidersByCountry(otcData, country) : []),
        [isSuccess, otcData, country],
    );

    useEffect(() => {
        if (providers?.length) {
            const hasSelectedProvider = providers.some(pvd => pvd.name === provider?.name);
            if (!hasSelectedProvider) {
                onProviderSelect(providers[0]);
            }
        }

        setIsModalOpen(false);
    }, [providers, provider, onProviderSelect]);

    if (!provider && !isLoading) {
        return (
            <Column padding={16} hasDivider>
                <Banner
                    intent="warning"
                    icon="warning"
                    title={<Translation id="TR_TRADING_NO_PROVIDERS_AVAILABLE" />}
                />
            </Column>
        );
    }

    const handleProviderSelect = (provider: OtcProviderType) => {
        onProviderSelect(provider);
        setIsModalOpen(false);
    };

    return (
        <>
            <GhostContainer
                onClick={() => setIsModalOpen(true)}
                isDisabled={isLoading}
                borderRadius={0}
            >
                <Row justifyContent="space-between" padding={20}>
                    <Text typographyStyle="body-md" align="start">
                        <Translation id="TR_TRADING_PROVIDER" />
                    </Text>
                    {isLoading ? (
                        <SkeletonRectangle animate />
                    ) : (
                        <Row gap={4}>
                            <Text
                                typographyStyle="body-md"
                                data-testid="@trading/concierge/provider-select/value"
                            >
                                {provider?.name}
                            </Text>

                            <Icon
                                name="caretRight"
                                size={20}
                                intent="neutral"
                                priority="secondary"
                            />
                        </Row>
                    )}
                </Row>
            </GhostContainer>
            {isModalOpen && (
                <Modal
                    onCancel={() => setIsModalOpen(false)}
                    width={400}
                    heading={<Translation id="TR_TRADING_PROVIDERS" />}
                >
                    <CardList>
                        {providers?.map(providerOption => (
                            <CardList.Item
                                key={providerOption.name}
                                onClick={() => handleProviderSelect(providerOption)}
                            >
                                <Text>{providerOption.name}</Text>
                            </CardList.Item>
                        ))}
                    </CardList>
                </Modal>
            )}
        </>
    );
};
