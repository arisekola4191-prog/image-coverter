import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import PaymentSuccess from "./PaymentSuccess";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
    </Routes>
  </BrowserRouter>
);
import React, { useState } from "react";
import jsPDF from "jspdf";

const PAYSTACK_LINK = "https://paystack.shop/pay/hfumkd7052";

const compressImage = (src, maxWidth = 1200, quality = 0.6) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");

      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = src;
  });
};

export default function App() {
  const [images, setImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const hasPaid = localStorage.getItem("hasPaid") === "true";

  const uploadImages = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setImages((prev) => [...prev, ev.target.result]);
      reader.readAsDataURL(file);
    });
  };

  const generatePDF = async () => {
    if (!images.length) return;
    setIsProcessing(true);

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    const cellHeight = 120;

    let y = margin;

    for (let src of images) {
      const compressed = await compressImage(src, 1200, 0.6);

      const img = new Image();
      img.src = compressed;
      await new Promise((r) => (img.onload = r));

      const ratio = Math.min(
        (pageWidth - margin * 2) / img.width,
        cellHeight / img.height
      );

      const w = img.width * ratio;
      const h = img.height * ratio;

      pdf.addImage(
        compressed,
        "JPEG",
        (pageWidth - w) / 2,
        y,
        w,
        h,
        undefined,
        "FAST"
      );

      y += h + margin;

      if (y + h > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
    }

    pdf.save("compressed-images.pdf");

    // 🔒 ONE-TIME ACCESS
    localStorage.removeItem("hasPaid");
    setIsProcessing(false);
  };

  return (
    <div style={{ padding: 30, maxWidth: 600, margin: "auto" }}>
      <h2>Image to PDF (Under 1MB)</h2>

      <input type="file" multiple accept="image/*" onChange={uploadImages} />

      <button
        style={{
          marginTop: 20,
          padding: 12,
          width: "100%",
          background: "#2563eb",
          color: "#fff",
          fontWeight: "bold",
          borderRadius: 8,
          border: "none",
        }}
        onClick={() => {
          if (!hasPaid) {
            window.open(PAYSTACK_LINK, "_blank");
            return;
          }
          generatePDF();
        }}
        disabled={isProcessing}
      >
        {hasPaid
          ? isProcessing
            ? "Generating PDF..."
            : "Generate PDF"
          : "Pay to Unlock PDF"}
      </button>

      {!hasPaid && (
        <p style={{ marginTop: 10, color: "#666" }}>
          One-time payment required to unlock PDF download.
        </p>
      )}
    </div>
  );
}
import React, { useEffect } from "react";

export default function PaymentSuccess() {
  useEffect(() => {
    localStorage.setItem("hasPaid", "true");
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ padding: 30, textAlign: "center", border: "1px solid #ddd", borderRadius: 10 }}>
        <h2 style={{ color: "green" }}>Payment Successful 🎉</h2>
        <p>Your one-time access is now unlocked.</p>

        <button
          onClick={() => (window.location.href = "/")}
          style={{
            marginTop: 20,
            padding: 12,
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: "bold",
          }}
        >
          Continue to Tool
        </button>
      </div>
    </div>
  );
}