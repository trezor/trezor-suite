import { type ReactElement } from 'react';

import { Translation } from '@suite/intl';
import { selectIsMetadataEnabled } from '@suite/metadata';
import { shouldDisplayExportBip329Labels } from '@suite-common/bip329';
import { type Bip329Label, bip329LabelSchema } from '@suite-common/bip329-types';
import { selectIsSuiteSyncEnabled } from '@suite-common/suite-sync';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type Account } from '@suite-common/wallet-types';
import {
    Button,
    ButtonGroup,
    type ButtonProps,
    Column,
    InfoItem,
    Paragraph,
} from '@trezor/components';
import {
    JsonlReader,
    type JsonlReaderError,
    formatJsonlReaderError,
} from '@trezor/product-components';
import { HELP_CENTER_BIP329_URL } from '@trezor/urls';

import { exportMetadataToBip329File } from 'src/actions/labels/exportMetadataToBip329File';
import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';
import { suiteSyncErrorHandler } from 'src/components/suite/labeling/suiteSyncErrorHandler';
import { useDefaultAccountLabel, useDispatch, useSelector } from 'src/hooks/suite';
import { useSuiteServices } from 'src/support/SuiteServicesProvider';
import { ContentFlex, useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';

type Bip329LabelsProps = {
    account: Account;
    isLoading: boolean;
};

export const Bip329Labels = ({ account, isLoading }: Bip329LabelsProps) => {
    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);
    const isMetadataEnabled = useSelector(selectIsMetadataEnabled);

    const dispatch = useDispatch();
    const { bip329 } = useSuiteServices();
    const { getDefaultAccountLabel } = useDefaultAccountLabel();
    const isContentBelowBreakpoint = useIsContentBelowBreakpoint();

    const canImportBip329Labels = isSuiteSyncEnabled;

    const shouldDisplayExport = shouldDisplayExportBip329Labels({
        account,
        isSuiteSyncEnabled,
        isMetadataEnabled,
    });

    if (!shouldDisplayExport) {
        return null;
    }

    const handleExportBip329 = () =>
        dispatch(exportMetadataToBip329File({ getDefaultAccountLabel, account }));

    const handleImportBip329 = async (bip329Labels: Bip329Label[]) => {
        const result = await bip329.import({
            account,
            bip329Labels,
        });

        if (!result.success) {
            suiteSyncErrorHandler({
                error: result.error,
                dispatch,
                deviceStaticSessionId: account.deviceState,
            });
        } else {
            dispatch(notificationsActions.addToast({ type: 'bip-329-labels-imported' }));
        }
    };

    const handleImportError = (error: JsonlReaderError) => {
        dispatch(
            notificationsActions.addToast({
                type: 'error',
                error: formatJsonlReaderError(error),
            }),
        );
    };

    return (
        <ContentFlex gap={40} justifyContent="space-between">
            <InfoItem
                label={<Translation id="TR_BIP_329_HEADER" />}
                typographyStyle="body-md"
                intent="neutral"
                priority="primary"
                gap={8}
                maxWidth={500}
            >
                <Column gap={12}>
                    <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_BIP_329_DESCRIPTION" />
                    </Paragraph>
                    <LearnMoreButton url={HELP_CENTER_BIP329_URL} />
                </Column>
            </InfoItem>

            <Column alignItems={isContentBelowBreakpoint ? 'flex-start' : 'flex-end'} gap={8}>
                <ButtonGroup intent="neutral" priority="secondary">
                    {canImportBip329Labels
                        ? ((
                              <JsonlReader
                                  buttonLabel={
                                      <Translation id="TR_ACCOUNT_DETAILS_IMPORT_LABELS_BUTTON" />
                                  }
                                  loadingLabel={<Translation id="TR_DOWNLOADING" />}
                                  schema={bip329LabelSchema}
                                  onDataLoaded={handleImportBip329}
                                  onError={handleImportError}
                                  variant="button"
                                  iconLeft={null}
                                  minWidth={140}
                                  data-testid="@wallets/details/import-label-bip329"
                              />
                          ) as ReactElement<ButtonProps>)
                        : null}
                    <Button
                        onClick={handleExportBip329}
                        isLoading={isLoading}
                        minWidth={140}
                        data-testid="@wallets/details/export-label-bip329"
                    >
                        <Translation id="TR_ACCOUNT_DETAILS_EXPORT_LABELS_BUTTON" />
                    </Button>
                </ButtonGroup>
            </Column>
        </ContentFlex>
    );
};
