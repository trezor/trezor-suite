import { Banner, Column } from '@trezor/components';

import { isEthereumChain } from './app/migrationState';
import { useMigration } from './app/useMigration';
import { buildEthereumScanReport } from './discovery/ethereumScanReport';
import { buildScanReport } from './discovery/scanReport';
import { ETHEREUM_CHAIN_DEFINITIONS } from './ethereum/ethereumChain';
import {
    getDiscoverableAccountTypes,
    wipesAfterWrongPinAttempts,
} from './firmware/firmwareSupport';
import { DeviceLostBanner } from './ui/DeviceLostBanner';
import { DiagnosticLogPanel } from './ui/DiagnosticLogPanel';
import { PageLayout } from './ui/PageLayout';
import { PinMatrix } from './ui/PinMatrix';
import { CoinStep } from './ui/steps/CoinStep';
import { DestinationStep } from './ui/steps/DestinationStep';
import { DeviceStep } from './ui/steps/DeviceStep';
import { DiscoveryStep } from './ui/steps/DiscoveryStep';
import { EthereumDestinationStep } from './ui/steps/EthereumDestinationStep';
import { EthereumDiscoveryStep } from './ui/steps/EthereumDiscoveryStep';
import { EthereumSummaryStep } from './ui/steps/EthereumSummaryStep';
import { EthereumTransfersStep } from './ui/steps/EthereumTransfersStep';
import { IntroStep } from './ui/steps/IntroStep';
import { PassphraseStep } from './ui/steps/PassphraseStep';
import { PreflightStep } from './ui/steps/PreflightStep';
import { SummaryStep } from './ui/steps/SummaryStep';
import { TransfersStep } from './ui/steps/TransfersStep';

export const App = () => {
    const { state, controller } = useMigration();
    const { step, device, deviceLostReason, coin } = state;

    const isBusy = state.activity !== undefined;
    const isDeviceUsable = deviceLostReason === undefined && !state.isDeviceReleased;
    const ethereumChain = isEthereumChain(coin) ? coin : undefined;
    const report =
        device && state.walletKind && coin === 'bitcoin'
            ? buildScanReport({
                  accounts: state.accounts,
                  scannedAccountTypes: getDiscoverableAccountTypes(device.firmwareVersion),
                  walletKind: state.walletKind,
              })
            : undefined;
    const ethereumReport =
        ethereumChain && state.walletKind
            ? buildEthereumScanReport({
                  chain: ethereumChain,
                  addresses: state.ethereum.addresses,
                  walletKind: state.walletKind,
              })
            : undefined;
    // The coin is chosen right after the device is accepted. Until then, the passphrase and
    // discovery steps show the choice.
    const isCoinChoice =
        device !== undefined &&
        coin === undefined &&
        (step === 'passphrase' || step === 'discovery');

    const renderStep = () => {
        if (isCoinChoice && device) {
            return (
                <CoinStep
                    firmwareVersion={device.firmwareVersion}
                    isBusy={isBusy}
                    onChoose={controller.chooseCoin}
                />
            );
        }

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
                        accounts={state.accounts}
                        report={report}
                        error={state.discoveryError}
                        isBusy={isBusy}
                        isDeviceUsable={isDeviceUsable}
                        onStart={controller.startDiscovery}
                        onScanMore={controller.scanMoreAccounts}
                        onContinue={controller.confirmDiscovery}
                    />
                );
            case 'destination':
                return device ? (
                    <DestinationStep
                        firmwareVersion={device.firmwareVersion}
                        error={state.destinationError}
                        isBusy={isBusy}
                        onSubmit={controller.submitDestination}
                    />
                ) : null;
            case 'transfers':
                return device && state.destination ? (
                    <TransfersStep
                        transfers={state.transfers}
                        destination={state.destination}
                        firmwareVersion={device.firmwareVersion}
                        isBusy={isBusy}
                        isDeviceUsable={isDeviceUsable}
                        isDeviceReleased={state.isDeviceReleased}
                        onSign={controller.signTransfer}
                        onBroadcast={controller.broadcastTransfer}
                        onRetry={controller.retryTransfer}
                        onRefresh={controller.refreshTransfers}
                        onEditDestination={controller.editDestination}
                        onFinish={controller.finish}
                    />
                ) : null;
            case 'ethereum-discovery':
                return ethereumChain ? (
                    <EthereumDiscoveryStep
                        chain={ethereumChain}
                        addresses={state.ethereum.addresses}
                        report={ethereumReport}
                        error={state.ethereum.discoveryError}
                        isBusy={isBusy}
                        isDeviceUsable={isDeviceUsable}
                        onStart={controller.ethereum.startDiscovery}
                        onScanMore={controller.ethereum.scanMoreAddresses}
                        onContinue={controller.ethereum.confirmDiscovery}
                        onChangeCoin={controller.changeCoin}
                    />
                ) : null;
            case 'ethereum-destination':
                return device && ethereumChain ? (
                    <EthereumDestinationStep
                        chain={ethereumChain}
                        firmwareVersion={device.firmwareVersion}
                        error={state.ethereum.destinationError}
                        isBusy={isBusy}
                        onSubmit={controller.ethereum.submitDestination}
                    />
                ) : null;
            case 'ethereum-transfers':
                return device && ethereumChain && state.ethereum.destination ? (
                    <EthereumTransfersStep
                        chain={ethereumChain}
                        transfers={state.ethereum.transfers}
                        destination={state.ethereum.destination}
                        firmwareVersion={device.firmwareVersion}
                        isBusy={isBusy}
                        isDeviceUsable={isDeviceUsable}
                        isDeviceReleased={state.isDeviceReleased}
                        onSign={controller.ethereum.signTransfer}
                        onBroadcast={controller.ethereum.broadcastTransfer}
                        onRetry={controller.ethereum.retryTransfer}
                        onRefresh={controller.refreshTransfers}
                        onEditDestination={controller.ethereum.editDestination}
                        onFinish={controller.finish}
                    />
                ) : null;
            case 'summary':
                return ethereumChain ? (
                    <EthereumSummaryStep
                        isDeviceLocked={state.isDeviceLocked}
                        symbol={ETHEREUM_CHAIN_DEFINITIONS[ethereumChain].symbol}
                        transfers={state.ethereum.transfers}
                        addresses={state.ethereum.addresses}
                        report={ethereumReport}
                        onRefresh={controller.refreshTransfers}
                    />
                ) : (
                    <SummaryStep
                        isDeviceLocked={state.isDeviceLocked}
                        transfers={state.transfers}
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
