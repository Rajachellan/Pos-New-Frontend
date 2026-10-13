import api from "../services/api";

export interface BranchReceiptInfo {
  branchId?: string;
  branchName: string;
  branchCode?: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  gstin?: string;
  fssai?: string;
  tagline?: string;
  receiptFooter?: string;
  orgName?: string;
}

/**
 * Fetch branch receipt info for active branch, falling back to organization defaults
 */
export async function getActiveBranchReceiptInfo(targetBranchId?: string): Promise<BranchReceiptInfo> {
  const fallbackInfo: BranchReceiptInfo = {
    branchName: "Andhra Spicy House",
    branchCode: "HQ-01",
    logoUrl: "",
    address: "17, CLC Works Rd, Pallavapuram, New Colony, Chromepet, Tambaram, Tamil Nadu 600044",
    phone: "",
    gstin: "33EAOPS1393L2Z0",
    fssai: "",
    tagline: "",
    receiptFooter: "Thank you! Visit again...!!!!",
    orgName: "Andhra Spicy House",
  };

  // 1. Check local storage terminal settings first as baseline
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("pos_terminal_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.restaurantName) fallbackInfo.branchName = parsed.restaurantName;
        if (parsed.logoUrl) fallbackInfo.logoUrl = parsed.logoUrl;
        if (parsed.address) fallbackInfo.address = parsed.address;
        if (parsed.phone) fallbackInfo.phone = parsed.phone;
        if (parsed.gstin) fallbackInfo.gstin = parsed.gstin;
        if (parsed.fssaiLicense) fallbackInfo.fssai = parsed.fssaiLicense;
        if (parsed.tagline) fallbackInfo.tagline = parsed.tagline;
        if (parsed.receiptFooter) fallbackInfo.receiptFooter = parsed.receiptFooter;
      }
    } catch (e) {
      console.warn("Could not read pos_terminal_settings", e);
    }
  }

  // 2. Determine target branch ID
  let branchId = targetBranchId;
  if (!branchId && typeof window !== "undefined") {
    const stored = localStorage.getItem("pos_selected_branch");
    if (stored && stored !== "ALL" && stored !== "b1") {
      branchId = stored;
    }
  }

  // 3. If branchId exists, fetch specific branch details
  if (branchId) {
    try {
      const res = await api.get(`/branch/${branchId}`);
      if (res.data?.success && res.data.data) {
        const b = res.data.data;
        const resolved: BranchReceiptInfo = {
          branchId: b._id,
          branchName: b.branchName || fallbackInfo.branchName,
          branchCode: b.branchCode || fallbackInfo.branchCode,
          logoUrl: b.logoUrl || fallbackInfo.logoUrl,
          address: b.address || fallbackInfo.address,
          phone: b.phone || fallbackInfo.phone,
          gstin: b.gstin || fallbackInfo.gstin,
          fssai: b.fssai || fallbackInfo.fssai,
          tagline: b.tagline || fallbackInfo.tagline,
          receiptFooter: b.receiptFooter || fallbackInfo.receiptFooter,
          orgName: fallbackInfo.orgName,
        };
        if (resolved.logoUrl && typeof window !== "undefined") {
          localStorage.setItem("pos_terminal_settings", JSON.stringify(resolved));
        }
        return resolved;
      }
    } catch (err) {
      console.warn("Failed to fetch branch by id, checking branch list fallback", err);
    }
  }

  // 4. Fetch /get/branch to locate ANY branch with an uploaded logo!
  try {
    const res = await api.get("/get/branch");
    if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
      const list = res.data.data;
      const match =
        (branchId ? list.find((item: any) => item._id === branchId) : null) ||
        list.find((item: any) => item.logoUrl && item.logoUrl.trim()) ||
        list[0];

      if (match) {
        const resolved: BranchReceiptInfo = {
          branchId: match._id,
          branchName: match.branchName || fallbackInfo.branchName,
          branchCode: match.branchCode || fallbackInfo.branchCode,
          logoUrl: match.logoUrl || fallbackInfo.logoUrl,
          address: match.address || fallbackInfo.address,
          phone: match.phone || fallbackInfo.phone,
          gstin: match.gstin || fallbackInfo.gstin,
          fssai: match.fssai || fallbackInfo.fssai,
          tagline: match.tagline || fallbackInfo.tagline,
          receiptFooter: match.receiptFooter || fallbackInfo.receiptFooter,
          orgName: fallbackInfo.orgName,
        };
        if (resolved.logoUrl && typeof window !== "undefined") {
          localStorage.setItem("pos_terminal_settings", JSON.stringify(resolved));
        }
        return resolved;
      }
    }
  } catch (e) {
    console.warn("Failed to fetch /get/branch fallback", e);
  }

  // 5. Try /get/branch/role fallback
  try {
    const res = await api.get("/get/branch/role");
    if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
      const list = res.data.data;
      const match =
        (branchId ? list.find((item: any) => item._id === branchId) : null) ||
        list.find((item: any) => item.logoUrl && item.logoUrl.trim()) ||
        list[0];

      if (match) {
        const resolved: BranchReceiptInfo = {
          branchId: match._id,
          branchName: match.branchName || fallbackInfo.branchName,
          branchCode: match.branchCode || fallbackInfo.branchCode,
          logoUrl: match.logoUrl || fallbackInfo.logoUrl,
          address: match.address || fallbackInfo.address,
          phone: match.phone || fallbackInfo.phone,
          gstin: match.gstin || fallbackInfo.gstin,
          fssai: match.fssai || fallbackInfo.fssai,
          tagline: match.tagline || fallbackInfo.tagline,
          receiptFooter: match.receiptFooter || fallbackInfo.receiptFooter,
          orgName: fallbackInfo.orgName,
        };
        if (resolved.logoUrl && typeof window !== "undefined") {
          localStorage.setItem("pos_terminal_settings", JSON.stringify(resolved));
        }
        return resolved;
      }
    }
  } catch (e) {
    console.warn("Failed to fetch /get/branch/role", e);
  }

  // 6. Fallback to organization profile
  try {
    const orgRes = await api.get("/organizations/profile");
    if (orgRes.data?.success && orgRes.data.data?.organization) {
      const org = orgRes.data.data.organization;
      return {
        branchName: org.name || fallbackInfo.branchName,
        logoUrl: org.logoUrl || fallbackInfo.logoUrl,
        address: org.address || fallbackInfo.address,
        phone: org.phno || fallbackInfo.phone,
        gstin: org.gstNumber || fallbackInfo.gstin,
        receiptFooter: fallbackInfo.receiptFooter,
        orgName: org.name || fallbackInfo.orgName,
      };
    }
  } catch (e) {
    // Return fallback
  }

  return fallbackInfo;
}

/**
 * Generate full thermal receipt HTML matching the exact design specification
 */
export function generateThermalReceiptHtml(params: {
  receiptInfo: BranchReceiptInfo;
  orderNumber: string;
  tokenNumber?: string | number;
  orderType?: "Takeaway" | "Dine-In" | "Delivery";
  tableNumber?: string | number;
  customerName?: string;
  cashierName?: string;
  dateStr?: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  gstAmount?: number;
  gstRate?: number;
  roundOff?: number;
  grandTotal: number;
  paymentMethod?: string;
}): string {
  const {
    receiptInfo,
    orderNumber,
    tokenNumber = "65",
    orderType = "Takeaway",
    tableNumber,
    customerName = "",
    cashierName = "biller",
    dateStr = new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    items,
    subtotal,
    gstAmount = 0,
    gstRate = 5,
    roundOff = 0,
    grandTotal,
    paymentMethod,
  } = params;

  const totalQty = items.reduce((sum, it) => sum + (it.quantity || 0), 0);
  const halfGstRate = (gstRate / 2).toFixed(1);
  const halfGstAmount = (gstAmount / 2).toFixed(2);

  const itemsHtml = items
    .map(
      (it) => `
      <tr>
        <td class="col-item">${it.name}</td>
        <td class="col-qty">${it.quantity}</td>
        <td class="col-price">${it.price.toFixed(2)}</td>
        <td class="col-amount">${(it.price * it.quantity).toFixed(2)}</td>
      </tr>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Receipt ${orderNumber}</title>
        <style>
          /* =========================================================
             TVS RP3160 Gold (80mm / 72mm Printable Width) Thermal Optimization
             - 203 DPI (8 dots/mm) High-Density Direct Thermal
             - Pure monochrome black (#000000) for highest thermal burn
             - Compact vertical spacing to fit 20+ items cleanly on one bill
             ========================================================= */
          @page {
            size: 80mm auto;
            margin: 0mm;
          }
          @media print {
            html, body {
              width: 72mm !important;
              max-width: 72mm !important;
              min-width: 72mm !important;
              margin: 0 auto !important;
              padding: 1mm 1.5mm 3mm 1.5mm !important;
              background: #ffffff !important;
              color: #000000 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            table, tr, td, th {
              page-break-inside: avoid !important;
            }
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            width: 72mm;
            max-width: 72mm;
            margin: 0 auto;
            padding: 1mm 1.5mm 3mm 1.5mm;
            background: #ffffff;
            color: #000000;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 11px;
            line-height: 1.2;
            -webkit-font-smoothing: antialiased;
            text-rendering: geometricPrecision;
          }

          /* Header & Branding - Compact & High-Contrast */
          .receipt-header {
            text-align: center;
            margin-bottom: 2px;
          }
          .logo-wrapper {
            margin-bottom: 2px;
            display: flex;
            justify-content: center;
          }
          .logo-img {
            max-height: 38px;
            max-width: 130px;
            object-fit: contain;
            display: block;
            margin: 0 auto;
            filter: grayscale(100%) contrast(250%) brightness(90%);
            -webkit-filter: grayscale(100%) contrast(250%) brightness(90%);
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
          }
          .brand-title {
            font-size: 15px;
            font-weight: 900;
            color: #000000;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin: 1px 0;
            line-height: 1.15;
          }
          .brand-tagline {
            font-size: 10px;
            font-weight: 700;
            color: #000000;
            text-transform: uppercase;
            margin: 0.5px 0;
            line-height: 1.1;
          }
          .brand-address, .brand-phone {
            font-size: 10px;
            font-weight: 700;
            color: #000000;
            margin: 0.5px 0;
            line-height: 1.2;
          }
          .brand-gstin {
            font-size: 11px;
            font-weight: 900;
            color: #000000;
            margin-top: 1px;
            letter-spacing: 0.3px;
          }

          /* Clean Dividers */
          .divider-solid {
            border-top: 1px solid #000000;
            margin: 2px 0;
          }
          .divider-dashed {
            border-top: 1px dashed #000000;
            margin: 2px 0;
          }

          /* Compact Token Strip (Saves 40px+ height) */
          .token-strip {
            border: 1.5px solid #000000;
            padding: 2px 6px;
            margin: 2px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .token-title {
            font-size: 10.5px;
            font-weight: 900;
            letter-spacing: 0.8px;
            text-transform: uppercase;
          }
          .token-number {
            font-size: 16px;
            font-weight: 900;
            letter-spacing: 0.5px;
            line-height: 1;
          }

          /* Metadata rows */
          .meta-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10.5px;
            font-weight: 700;
            color: #000000;
            margin: 1px 0;
            line-height: 1.2;
          }
          .order-type-tag {
            font-weight: 900;
            text-transform: uppercase;
          }

          /* High-Density Items Table (Fits 20+ items cleanly) */
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 2px 0;
            table-layout: fixed;
          }
          .items-table th {
            padding: 2.5px 1px;
            font-size: 10px;
            font-weight: 900;
            color: #000000;
            text-transform: uppercase;
            border-top: 1px dashed #000000;
            border-bottom: 1px dashed #000000;
          }
          .items-table td {
            padding: 1.5px 1px;
            font-size: 10.5px;
            font-weight: 700;
            color: #000000;
            vertical-align: top;
            line-height: 1.15;
          }
          .col-item {
            width: 50%;
            text-align: left;
            word-break: break-word;
          }
          .col-qty {
            width: 13%;
            text-align: center;
          }
          .col-price {
            width: 17%;
            text-align: right;
            font-variant-numeric: tabular-nums;
          }
          .col-amount {
            width: 20%;
            text-align: right;
            font-weight: 800;
            font-variant-numeric: tabular-nums;
          }

          /* Compact Totals Table */
          .totals-table {
            width: 100%;
            font-size: 10.5px;
            font-weight: 700;
            color: #000000;
            border-collapse: collapse;
            margin: 1.5px 0;
          }
          .totals-table td {
            padding: 1px 0;
            line-height: 1.2;
          }

          /* Grand Total Bar */
          .grand-total-container {
            border-top: 1.5px solid #000000;
            border-bottom: 1.5px solid #000000;
            padding: 3px 0;
            margin: 3px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .grand-total-label {
            font-size: 13px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .grand-total-val {
            font-size: 16px;
            font-weight: 900;
            letter-spacing: -0.2px;
          }

          .payment-row {
            text-align: right;
            font-size: 10.5px;
            font-weight: 900;
            margin-top: 1.5px;
          }

          /* Footer */
          .receipt-footer {
            text-align: center;
            margin-top: 4px;
            margin-bottom: 2px;
          }
          .footer-msg {
            font-size: 11px;
            font-weight: 800;
            font-style: italic;
            color: #000000;
            margin-bottom: 2px;
          }
          .footer-divider {
            width: 48px;
            height: 1px;
            background: #000000;
            margin: 2px auto;
          }
        </style>
      </head>
      <body>
        <div class="receipt-header">
          ${
            receiptInfo.logoUrl
              ? `<div class="logo-wrapper"><img class="logo-img" src="${receiptInfo.logoUrl}" alt="${receiptInfo.branchName}" /></div>`
              : ""
          }
          <div class="brand-title">${receiptInfo.branchName}</div>
          ${receiptInfo.tagline ? `<div class="brand-tagline">${receiptInfo.tagline}</div>` : ""}
          ${receiptInfo.address ? `<div class="brand-address">${receiptInfo.address}</div>` : ""}
          ${receiptInfo.phone ? `<div class="brand-phone">Tel: ${receiptInfo.phone}</div>` : ""}
          ${receiptInfo.gstin ? `<div class="brand-gstin">GSTIN: ${receiptInfo.gstin}</div>` : ""}
        </div>

        <div class="divider-solid"></div>

        ${
          customerName && customerName.trim()
            ? `<div class="meta-row" style="margin-bottom: 2px;">
                 <span>Customer: <strong>${customerName}</strong></span>
               </div>`
            : ""
        }

        <div class="meta-row">
          <span>Date: ${dateStr}</span>
          <span class="order-type-tag">${orderType}${tableNumber ? ` (Table #${tableNumber})` : ""}</span>
        </div>
        <div class="meta-row">
          <span>Bill No: ${orderNumber}</span>
          <span>Cashier: ${cashierName}</span>
        </div>

        <div class="token-strip">
          <span class="token-title">TOKEN NUMBER</span>
          <span class="token-number">#${tokenNumber}</span>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th class="col-item">Item</th>
              <th class="col-qty">Qty</th>
              <th class="col-price">Price</th>
              <th class="col-amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="divider-dashed"></div>

        <table class="totals-table">
          <tr>
            <td style="width: 45%; font-weight: 800;">Total Qty: ${totalQty}</td>
            <td style="text-align: right; font-weight: 700;">Sub Total:</td>
            <td style="text-align: right; font-weight: 800; width: 26%;">₹${subtotal.toFixed(2)}</td>
          </tr>
          ${
            gstAmount > 0
              ? `
            <tr>
              <td></td>
              <td style="text-align: right; font-weight: 700;">CGST ${halfGstRate}%:</td>
              <td style="text-align: right; font-weight: 800;">₹${halfGstAmount}</td>
            </tr>
            <tr>
              <td></td>
              <td style="text-align: right; font-weight: 700;">SGST ${halfGstRate}%:</td>
              <td style="text-align: right; font-weight: 800;">₹${halfGstAmount}</td>
            </tr>
          `
              : ""
          }
          ${
            roundOff !== 0
              ? `
            <tr>
              <td></td>
              <td style="text-align: right; font-weight: 700;">Round off:</td>
              <td style="text-align: right; font-weight: 800;">${roundOff > 0 ? "+" : ""}₹${roundOff.toFixed(2)}</td>
            </tr>
          `
              : ""
          }
        </table>

        <div class="grand-total-container">
          <span class="grand-total-label">Grand Total</span>
          <span class="grand-total-val">₹${grandTotal.toFixed(2)}</span>
        </div>

        ${
          paymentMethod
            ? `<div class="payment-row">PAYMENT: ${paymentMethod.toUpperCase()} (PAID)</div>`
            : ""
        }

        <div class="receipt-footer">
          <div class="footer-msg">
            ${receiptInfo.receiptFooter || "Thank you! Visit again...!!!"}
          </div>
          <div class="footer-divider"></div>
        </div>

        <script>
          function executePrint() {
            window.focus();
            window.print();
          }
          window.onafterprint = function() {
            setTimeout(function() {
              window.close();
            }, 300);
          };
          var img = document.querySelector('.logo-img');
          if (img && !img.complete) {
            img.onload = executePrint;
            img.onerror = executePrint;
            setTimeout(executePrint, 1200);
          } else {
            if (document.readyState === 'complete') {
              setTimeout(executePrint, 150);
            } else {
              window.addEventListener('load', function() {
                setTimeout(executePrint, 150);
              });
            }
          }
        </script>
      </body>
    </html>
  `;
}
