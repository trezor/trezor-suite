import { Banner, Column } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { HELP_CENTER_TRANSACTION_FEES_URL } from '@trezor/urls';

import { Translation } from 'src/components/suite';
import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';

interface CustomFeeWrapperProps {
    children: React.ReactNode;
}

export const CustomFeeWrapper = ({ children }: CustomFeeWrapperProps) => (
    <Column gap={spacings.xs} margin={{ bottom: spacings.md }}>
        <Banner
            icon
            variant="warning"
            rightContent={
                <LearnMoreButton
                    textWrap={false}
                    url={HELP_CENTER_TRANSACTION_FEES_URL}
                    variant="warning"
                />
            }
        >
            <Translation id="TR_CUSTOM_FEE_WARNING" />
        </Banner>
        {children}
    </Column>
);
