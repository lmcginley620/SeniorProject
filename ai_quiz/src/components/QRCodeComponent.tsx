import React from 'react';
import { QRCode } from 'react-qr-code';  // Import from react-qr-code

const QRCodeComponent: React.FC = () => {
  const appUrl = "https://l23tlg32-5173.use.devtunnels.ms/"; // Replace with your actual app URL

  return (
    <div>
      <h2>Scan this QR Code to open the game!</h2>
      <QRCode value={appUrl} size={256} />
    </div>
  );
};

export default QRCodeComponent;
