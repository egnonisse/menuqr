"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { PrinterIcon } from "@heroicons/react/24/outline";

interface QrCodeGeneratorProps {
  value: string;
  size?: number;
  title: string;
  subtitle?: string;
}

const PAPER_SIZES = {
  "A4": { width: "210mm", height: "297mm", name: "A4 (210 × 297 mm)" },
  "A5": { width: "148mm", height: "210mm", name: "A5 (148 × 210 mm)" },
  "A6": { width: "105mm", height: "148mm", name: "A6 (105 × 148 mm)" },
  "A7": { width: "74mm", height: "105mm", name: "A7 (74 × 105 mm)" },
  "A8": { width: "52mm", height: "74mm", name: "A8 (52 × 74 mm)" },
  "A10": { width: "26mm", height: "37mm", name: "A10 (26 × 37 mm)" },
} as const;

export default function QrCodeGenerator({ value, size = 200, title, subtitle }: QrCodeGeneratorProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<keyof typeof PAPER_SIZES>("A5");
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    generateQrCode();
  }, [value, size]);

  const generateQrCode = async () => {
    try {
      const dataUrl = await QRCode.toDataURL(value, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const paperSize = PAPER_SIZES[selectedSize];
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Impression QR Code - ${title}</title>
          <style>
            @page {
              size: ${paperSize.width} ${paperSize.height};
              margin: 10mm;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: calc(100vh - 40px);
              text-align: center;
            }
            .qr-container {
              border: 2px solid #000;
              padding: 20px;
              border-radius: 10px;
              background: white;
            }
            .title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 10px;
              color: #333;
            }
            .subtitle {
              font-size: 14px;
              color: #666;
              margin-bottom: 20px;
            }
            .qr-image {
              margin: 10px 0;
            }
            .url {
              font-size: 10px;
              color: #888;
              margin-top: 15px;
              word-break: break-all;
              max-width: 250px;
            }
            .footer {
              margin-top: 20px;
              font-size: 10px;
              color: #aaa;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="title">${title}</div>
            ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
            <div class="qr-image">
              <img src="${qrCodeDataUrl}" alt="QR Code" style="width: 150px; height: 150px;" />
            </div>
            <div class="url">${value}</div>
            <div class="footer">Powered by MenuQR</div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Attendre que l'image soit chargée avant d'imprimer
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <div className="text-center">
      {/* QR Code Display */}
      <div className="bg-white p-6 rounded-lg border-2 border-gray-200 mb-4">
        {qrCodeDataUrl ? (
          <img
            src={qrCodeDataUrl}
            alt="QR Code"
            className="mx-auto mb-4"
            style={{ width: size, height: size }}
          />
        ) : (
          <div 
            className="bg-gray-100 flex items-center justify-center mx-auto mb-4 rounded"
            style={{ width: size, height: size }}
          >
            <div className="text-gray-400">Génération...</div>
          </div>
        )}
      </div>

      {/* URL Display */}
      <div className="bg-gray-50 p-3 rounded text-xs break-all mb-4">
        <strong>URL:</strong> {value}
      </div>

      {/* Print Button */}
      <div className="space-y-3">
        <button
          onClick={() => setShowPrintOptions(!showPrintOptions)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <PrinterIcon className="h-4 w-4" />
          Options d'impression
        </button>

        {/* Print Options */}
        {showPrintOptions && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="font-medium text-gray-900 mb-3">Format d'impression</h4>
            <div className="space-y-2 mb-4">
              {Object.entries(PAPER_SIZES).map(([key, paper]) => (
                <label key={key} className="flex items-center">
                  <input
                    type="radio"
                    name="paper-size"
                    value={key}
                    checked={selectedSize === key}
                    onChange={(e) => setSelectedSize(e.target.value as keyof typeof PAPER_SIZES)}
                    className="mr-2"
                  />
                  <span className="text-sm">{paper.name}</span>
                </label>
              ))}
            </div>
            <button
              onClick={handlePrint}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              🖨️ Imprimer
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 