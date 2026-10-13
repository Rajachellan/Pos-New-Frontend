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
        <td style="padding: 4px 0; text-align: left; font-weight: 500; color: #111; word-break: break-word;">${it.name}</td>
        <td style="padding: 4px 6px; text-align: center; font-weight: 700; color: #222;">${it.quantity}</td>
        <td style="padding: 4px 6px; text-align: right; color: #222;">${it.price.toFixed(2)}</td>
        <td style="padding: 4px 0; text-align: right; font-weight: 700; color: #111;">${(it.price * it.quantity).toFixed(2)}</td>
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
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          @page {
            margin: 0;
            size: auto;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            margin: 0;
            padding: 16px 14px 24px 14px;
            background: #fff;
            color: #111;
            max-width: 320px;
            margin: 0 auto;
            font-size: 11.5px;
            line-height: 1.35;
          }
          .header {
            text-align: center;
            margin-bottom: 6px;
          }
          .logo-container {
            margin-bottom: 6px;
            display: flex;
            justify-content: center;
          }
          .logo-img {
            max-height: 85px;
            max-width: 190px;
            object-fit: contain;
            display: block;
            margin: 0 auto;
          }
          .branch-name {
            font-size: 18px;
            font-weight: 900;
            color: #c92a2a;
            text-transform: uppercase;
            letter-spacing: -0.3px;
            margin: 2px 0;
          }
          .branch-sub {
            font-size: 11px;
            color: #333;
            margin: 1.5px 0;
            line-height: 1.35;
          }
          .gst-badge {
            font-size: 12px;
            font-weight: 800;
            color: #000;
            margin-top: 3px;
          }
          .red-line {
            border-top: 2px solid #b91c1c;
            margin: 8px 0 6px 0;
          }
          .red-dashed {
            border-top: 1px dashed #ef4444;
            margin: 6px 0;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11.5px;
            margin: 2px 0;
            color: #111;
          }
          .token-badge {
            color: #b91c1c;
            font-weight: 900;
            font-size: 17px;
            letter-spacing: -0.3px;
          }
          .order-type-badge {
            color: #b91c1c;
            font-weight: 900;
            font-size: 13px;
            text-transform: uppercase;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11.5px;
            margin: 4px 0;
          }
          th {
            background-color: #f5e9d9;
            padding: 5px 4px;
            font-weight: 800;
            color: #111;
            font-size: 11px;
            border-top: 1px solid #e2e8f0;
            border-bottom: 1px solid #e2e8f0;
          }
          .totals-table {
            width: 100%;
            font-size: 11.5px;
            margin-top: 4px;
          }
          .totals-table td {
            padding: 2.5px 0;
          }
          .grand-total-bar {
            background-color: #fae7dc;
            border-top: 2.5px solid #b91c1c;
            border-bottom: 2.5px solid #b91c1c;
            padding: 7px 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 8px 0;
            font-weight: 900;
            color: #b91c1c;
          }
          .grand-total-label {
            font-size: 15px;
            text-transform: uppercase;
            letter-spacing: 0.2px;
          }
          .grand-total-val {
            font-size: 18px;
            letter-spacing: -0.2px;
          }
          .footer-note {
            text-align: center;
            margin-top: 12px;
            font-family: 'Caveat', 'Dancing Script', cursive;
            font-size: 21px;
            font-weight: 700;
            color: #111;
          }
          .footer-line {
            width: 75px;
            height: 3px;
            background: #b91c1c;
            border-radius: 9999px;
            margin: 4px auto 0 auto;
          }
          .paper-zigzag {
            width: 100%;
            height: 12px;
            margin-top: 16px;
            background: radial-gradient(circle at 10px -5px, transparent 12px, #fff 13px) repeat-x;
            background-size: 20px 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${
            receiptInfo.logoUrl
              ? `<div class="logo-container"><img class="logo-img" src="${receiptInfo.logoUrl}" alt="${receiptInfo.branchName}" /></div>`
              : `<div class="branch-name">${receiptInfo.branchName}</div>`
          }
          ${receiptInfo.tagline ? `<div class="branch-sub" style="font-weight: 600; color: #b91c1c;">${receiptInfo.tagline}</div>` : ""}
          ${receiptInfo.address ? `<div class="branch-sub">${receiptInfo.address}</div>` : ""}
          ${receiptInfo.phone ? `<div class="branch-sub">Tel: ${receiptInfo.phone}</div>` : ""}
          ${receiptInfo.gstin ? `<div class="gst-badge">GSTIN: <span style="font-family: monospace;">${receiptInfo.gstin}</span></div>` : ""}
        </div>

        <div class="red-line"></div>

        <div style="font-size: 11.5px; margin-bottom: 4px; color: #111; display: flex; align-items: baseline;">
          <span style="font-weight: 600; margin-right: 4px;">Name:</span>
          <span style="border-bottom: 1px dotted #94a3b8; flex: 1; height: 12px; display: inline-block;">${customerName}</span>
        </div>

        <div class="red-dashed"></div>

        <div class="meta-row">
          <span>Date: ${dateStr}</span>
          <span class="order-type-badge">${orderType}</span>
        </div>
        <div class="meta-row" style="color: #333;">
          <span>Cashier: ${cashierName}</span>
          <span>Bill No.: ${orderNumber}</span>
        </div>
        ${tableNumber ? `<div class="meta-row"><span>Table: #${tableNumber}</span></div>` : ""}
        <div class="meta-row" style="margin-top: 3px;">
          <span class="token-badge">Token No.: ${tokenNumber}</span>
        </div>

        <div class="red-dashed"></div>

        <table>
          <thead>
            <tr>
              <th style="text-align: left;">Item</th>
              <th style="text-align: center;">Qty.</th>
              <th style="text-align: right;">Price (₹)</th>
              <th style="text-align: right;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody style="border-bottom: 1px dotted #e2e8f0;">
            ${itemsHtml}
          </tbody>
        </table>

        <div class="red-dashed"></div>

        <table class="totals-table">
          <tr>
            <td style="font-weight: 700; width: 45%;">Total Qty: ${totalQty}</td>
            <td style="text-align: right; color: #475569;">Sub Total</td>
            <td style="text-align: right; font-weight: 700; width: 28%;">₹ ${subtotal.toFixed(2)}</td>
          </tr>
          ${
            gstAmount > 0
              ? `
            <tr>
              <td></td>
              <td style="text-align: right; color: #475569;">CGST ${halfGstRate}%</td>
              <td style="text-align: right; font-weight: 700;">₹ ${halfGstAmount}</td>
            </tr>
            <tr>
              <td></td>
              <td style="text-align: right; color: #475569;">SGST ${halfGstRate}%</td>
              <td style="text-align: right; font-weight: 700;">₹ ${halfGstAmount}</td>
            </tr>
          `
              : ""
          }
          ${
            roundOff !== 0
              ? `
            <tr>
              <td></td>
              <td style="text-align: right; color: #475569;">Round off</td>
              <td style="text-align: right; font-weight: 700;">${roundOff > 0 ? "+" : ""} ₹ ${roundOff.toFixed(2)}</td>
            </tr>
          `
              : ""
          }
        </table>

        <div class="grand-total-bar">
          <span class="grand-total-label">Grand Total</span>
          <span class="grand-total-val">₹ ${grandTotal.toFixed(2)}</span>
        </div>

        ${
          paymentMethod
            ? `<div style="font-size: 11px; text-align: right; font-weight: 700; color: #15803d; margin-top: 2px;">Payment: ${paymentMethod} (PAID)</div>`
            : ""
        }

        <div class="footer-note">
          ${receiptInfo.receiptFooter || "Thank you! Visit again...!!!"}
        </div>
        <div class="footer-line"></div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() {
              window.close();
            }, 600);
          };
        </script>
      </body>
    </html>
  `;
}
