import { Banner, Column } from '@trezor/components';

import { getCoinsToMove, mapEthereumChains } from './app/migrationState';
import { useMigration } from './app/useMigration';
import { buildWalletScanReport } from './discovery/walletScanReport';
import { ETHEREUM_CHAINS } from './ethereum/ethereumChain';
import {
    getDiscoverableAccountTypes,
    isEthereumSupported,
    wipesAfterWrongPinAttempts,
} from './firmware/firmwareSupport';
import { DeviceLostBanner } from './ui/DeviceLostBanner';
import { DiagnosticLogPanel } from './ui/DiagnosticLogPanel';
import { PageLayout } from './ui/PageLayout';
import { PinMatrix } from './ui/PinMatrix';
import { DestinationStep } from './ui/steps/DestinationStep';
import { DeviceStep } from './ui/steps/DeviceStep';
import { DiscoveryStep } from './ui/steps/DiscoveryStep';
import { IntroStep } from './ui/steps/IntroStep';
import { PassphraseStep } from './ui/steps/PassphraseStep';
import { PreflightStep } from './ui/steps/PreflightStep';
import { SummaryStep } from './ui/steps/SummaryStep';
import { TransfersStep } from './ui/steps/TransfersStep';

export const App = () => {
    const { state, controller } = useMigration();
    const { step, device, deviceLostReason } = state;

    const isBusy = state.activity !== undefined;
    const isDeviceUsable = deviceLostReason === undefined && !state.isDeviceReleased;
    const ethereumChains =
        device && isEthereumSupported(device.firmwareVersion) ? ETHEREUM_CHAINS : [];
    const report =
        device && state.walletKind
            ? buildWalletScanReport({
                  walletKind: state.walletKind,
                  accounts: state.bitcoin.accounts,
                  scannedAccountTypes: getDiscoverableAccountTypes(device.firmwareVersion),
                  isBitcoinInterrupted: state.bitcoin.discoveryError !== undefined,
                  ethereum: ethereumChains.map(chain => ({
                      chain,
                      addresses: state.ethereum[chain].addresses,
                      isInterrupted: state.ethereum[chain].discoveryError !== undefined,
                  })),
              })
            : undefined;

    const renderStep = () => {
        switch (step) {
            case 'intro':
                return <IntroStep onStart={controller.runPreflight} />;
            case 'preflight':
                return (
                    <PreflightStep
                        issue={state.preflightIssue}
                        isChecking={isBusy}
                        onRetry={controller.runPreflight}
                    />
                );
            case 'device':
                return (
                    <DeviceStep
                        issue={state.deviceIssue}
                        isConnecting={isBusy}
                        onConnect={controller.connectDevice}
                    />
                );
            case 'passphrase':
                return (
                    <PassphraseStep
                        error={state.passphraseError}
                        isBusy={isBusy}
                        onSubmit={controller.submitPassphrase}
                    />
                );
            case 'discovery':
                return (
                    <DiscoveryStep
                        accounts={state.bitcoin.accounts}
                        bitcoinError={state.bitcoin.discoveryError}
                        ethereumChains={ethereumChains}
                        ethereum={state.ethereum}
                        error={state.discoveryError}
                        report={report}
                        isBusy={isBusy}
                        isDeviceUsable={isDeviceUsable}
                        onStart={controller.startDiscovery}
                        onScanMoreAccounts={controller.scanMoreAccounts}
                        onScanMoreAddresses={controller.scanMoreAddresses}
                        onContinue={controller.confirmDiscovery}
                    />
                );
            case 'destination':
                return device ? (
                    <DestinationStep
                        firmwareVersion={device.firmwareVersion}
                        coins={getCoinsToMove(state)}
                        bitcoinError={state.bitcoin.destinationError}
                        ethereumErrors={mapEthereumChains(
                            chain => state.ethereum[chain].destinationError,
                        )}
                        isBusy={isBusy}
                        onSubmit={controller.submitDestinations}
                    />
                ) : null;
            case 'transfers':
                return device ? (
                    <TransfersStep
                        bitcoin={state.bitcoin}
                        ethereum={state.ethereum}
                        firmwareVersion={device.firmwareVersion}
                        isBusy={isBusy}
                        isDeviceUsable={isDeviceUsable}
                        isDeviceReleased={state.isDeviceReleased}
                        onSign={controller.signTransfer}
                        onRetry={controller.retryTransfer}
                        onRefresh={controller.refreshTransfers}
                        onEditDestinations={controller.editDestinations}
                        onFinish={controller.finish}
                    />
                ) : null;
            case 'summary':
                return (
                    <SummaryStep
                        isDeviceLocked={state.isDeviceLocked}
                        bitcoinTransfers={state.bitcoin.transfers}
                        ethereum={state.ethereum}
                        report={report}
                        onRefresh={controller.refreshTransfers}
                    />
                );
            // no default
        }
    };

    return (
        <PageLayout>
            <Column gap={16}>
                {deviceLostReason && <DeviceLostBanner reason={deviceLostReason} />}
                {state.unexpectedError !== undefined && (
                    <Banner
                        intent="critical"
                        title="Something unexpected went wrong"
                        description={`${state.unexpectedError}. Nothing further was done. If a signed transaction is shown below, copy it before you reload the page.`}
                    />
                )}
                {state.isConfirmationOnDeviceRequested && !deviceLostReason && (
                    <Banner
                        intent="info"
                        title="Look at your Trezor"
                        description="It is waiting for you to confirm or reject what it shows."
                    />
                )}
                {state.isPinRequested && device && (
                    <PinMatrix
                        isWipedAfterWrongAttempts={wipesAfterWrongPinAttempts(
                            device.firmwareVersion,
                        )}
                        onSubmit={controller.submitPin}
                        onCancel={controller.cancelPin}
                    />
                )}
                {renderStep()}
                <DiagnosticLogPanel />
            </Column>
        </PageLayout>
    );
};
