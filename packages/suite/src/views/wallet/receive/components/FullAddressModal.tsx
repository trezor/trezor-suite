import React, { useState } from 'react';
import styled from 'styled-components';

import { Address } from 'src/components/suite/Address';
import { QrCode } from 'src/components/suite/QrCode';
import { Translation } from 'src/components/suite/Translation';
import { copyToClipboard } from '@trezor/dom-utils';
import { Button, Modal, Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

interface FullAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  fullAddress: string;
}

const ContentWrapper = styled(Column)`
  gap: ${spacings.xl};
  align-items: center;
`;

const StyledAddress = styled(Address)`
  // Overriding default Address component styles if necessary,
  // for example, to ensure it does not truncate.
  // However, the Address component should ideally take a prop for this.
  // For now, assuming it shows the full address by default or via a prop.
  // If Address component truncates by default, we might need a different approach
  // or use a simple Text component. Let's assume `showFull` prop exists or it shows full by default.
  word-break: break-all; // Ensure long addresses wrap and don't overflow
  margin-bottom: ${spacings.lg};
`;

const QrCodeWrapper = styled.div`
  padding: ${spacings.sm}; // Adjusted padding slightly
  background-color: white; // QR codes are typically black on white
  border-radius: ${spacings.xs};
  display: inline-block; // To make the background fit the QR code size
  margin: ${spacings.md} 0 ${spacings.lg};
`;

export const FullAddressModal: React.FC<FullAddressModalProps> = ({
  isOpen,
  onClose,
  fullAddress,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyToClipboard(fullAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={<Translation id="FULL_ADDRESS_MODAL_TITLE">Full Address</Translation>}
      footerActions={[
        {
          label: <Translation id="CLOSE_BUTTON_LABEL">Close</Translation>,
          onClick: onClose,
          variant: 'secondary', // Changed to secondary
          buttonProps: { 'data-testid': '@fullAddressModal/close-button' },
        },
      ]}
    >
      <ContentWrapper>
        <QrCodeWrapper>
          <QrCode data={fullAddress} size={150} />
        </QrCodeWrapper>

        {/* Assuming Address component can show full address with `showFull` prop.
            If not, this might need adjustment or use a simple Text component.
        */}
        <StyledAddress address={fullAddress} showFull data-testid="@fullAddressModal/address" />

        <Button
          variant="primary" // Added primary variant
          onClick={handleCopy}
          data-testid="@fullAddressModal/copy-button"
          minWidth={180} // Retained minWidth, can be adjusted if "Copied!" text is too long
        >
          {copied ? (
            <Translation id="COPIED_FEEDBACK_TEXT">Copied!</Translation>
          ) : (
            <Translation id="COPY_ADDRESS_BUTTON_LABEL">Copy Address</Translation>
          )}
        </Button>
      </ContentWrapper>
    </Modal>
  );
};
