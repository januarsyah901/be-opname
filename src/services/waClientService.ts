import { Client, LocalAuth, RemoteAuth } from "whatsapp-web.js";
import qrcode from "qrcode";
import prisma from "../config/prisma";
import { SupabaseStore } from "./SupabaseStore";

type ClientStatus =
  | "initializing"
  | "qr_ready"
  | "authenticated"
  | "ready"
  | "disconnected";

let waClient: Client | null = null;
let clientStatus: ClientStatus = "initializing";
let lastQrBase64: string | null = null;
let lastQrExpiresAt: Date | null = null;

const QR_TIMEOUT_MS = 2 * 60 * 1000; 

const updateDbState = async (
  status: ClientStatus,
  qr: string | null = null,
  botInfo: { name?: string | null; number?: string | null; avatar?: string | null } = {}
) => {
  try {
    const profile = await prisma.bengkel_profile.findFirst();
    
    if (!profile) {
      await prisma.bengkel_profile.create({
        data: {
          name: "AutoService",
          wa_gateway_status: status,
          wa_gateway_qr: qr,
          wa_bot_name: botInfo.name,
          wa_bot_number: botInfo.number,
          wa_bot_avatar: botInfo.avatar,
        },
      });
    } else {
      await prisma.bengkel_profile.update({
        where: { id: profile.id },
        data: {
          wa_gateway_status: status,
          wa_gateway_qr: qr,
          wa_bot_name: botInfo.name,
          wa_bot_number: botInfo.number,
          wa_bot_avatar: botInfo.avatar,
        },
      });
    }
  } catch (err) {
    console.error("[WA] Failed to update DB state:", err);
  }
};

export const initWaClient = (): void => {
  if (waClient) return;

  console.log("[WA] Initializing WhatsApp Web client...");
  updateDbState("initializing");

  waClient = new Client({
    authStrategy: new LocalAuth({
      clientId: "RemoteAuth",
      dataPath: ".wwebjs_auth"
    }),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
    },
  });

  waClient.on("qr", async (qr) => {
    console.log("[WA] QR received, expires in 2 minutes.");
    
    // Cetak QR code di terminal agar bisa discan langsung
    qrcode.toString(qr, { type: 'terminal', small: true }, (err, url) => {
      if (!err) {
        console.log(url);
      }
    });

    clientStatus = "qr_ready";
    lastQrExpiresAt = new Date(Date.now() + QR_TIMEOUT_MS);
    try {
      lastQrBase64 = await qrcode.toDataURL(qr);
      updateDbState("qr_ready", lastQrBase64);
    } catch (err) {
      console.error("[WA] Failed to convert QR to base64:", err);
    }
  });

  waClient.on("authenticated", () => {
    console.log("[WA] Authenticated!");
    clientStatus = "authenticated";
    lastQrBase64 = null;
    lastQrExpiresAt = null;
    updateDbState("authenticated", null);
  });

  waClient.on("ready", async () => {
    console.log("[WA] Client is ready!");
    clientStatus = "ready";
    
    // Ambil info bot
    let avatarUrl = null;
    try {
      if (waClient?.info.wid) {
        avatarUrl = await waClient.getProfilePicUrl(waClient.info.wid._serialized);
      }
    } catch (e) {}

    updateDbState("ready", null, {
      name: waClient?.info.pushname,
      number: waClient?.info.wid.user,
      avatar: avatarUrl
    });
  });

  waClient.on("disconnected", (reason) => {
    console.warn("[WA] Client disconnected:", reason);
    clientStatus = "disconnected";
    waClient = null;
    lastQrBase64 = null;
    updateDbState("disconnected", null, { name: null, number: null, avatar: null });
  });

  waClient.on("auth_failure", (msg) => {
    console.error("[WA] Auth failure:", msg);
    clientStatus = "disconnected";
    waClient = null;
    updateDbState("disconnected", null, { name: null, number: null, avatar: null });
  });

  clientStatus = "initializing";
  waClient.initialize().catch((err) => {
    console.error("[WA] Initialize error:", err);
    clientStatus = "disconnected";
    updateDbState("disconnected", null, { name: null, number: null, avatar: null });
  });
};

export const restartWaClient = (): void => {
  if (waClient) {
    waClient.destroy().catch(() => {});
    waClient = null;
  }
  clientStatus = "initializing";
  lastQrBase64 = null;
  lastQrExpiresAt = null;
  updateDbState("initializing", null, { name: null, number: null, avatar: null });
  initWaClient();
};

export const getWaStatus = (): {
  status: ClientStatus;
  qr_expires_at: Date | null;
} => {
  return {
    status: clientStatus,
    qr_expires_at: lastQrExpiresAt,
  };
};

export const getWaStatusFromDb = async () => {
  const profile = await prisma.bengkel_profile.findFirst({
    select: { 
      wa_gateway_status: true, 
      updated_at: true,
      wa_bot_name: true,
      wa_bot_number: true,
      wa_bot_avatar: true
    }
  });
  
  return {
    status: (profile?.wa_gateway_status as ClientStatus) || "disconnected",
    updated_at: profile?.updated_at,
    bot: {
      name: profile?.wa_bot_name,
      number: profile?.wa_bot_number,
      avatar: profile?.wa_bot_avatar
    }
  };
};

export const getWaQrFromDb = async () => {
  const profile = await prisma.bengkel_profile.findFirst({
    select: { wa_gateway_qr: true, wa_gateway_status: true }
  });
  
  if (profile?.wa_gateway_status !== "qr_ready") return null;
  return profile?.wa_gateway_qr;
};

export const getWaQr = (): string | null => {
  if (clientStatus === "ready" || clientStatus === "authenticated") return null;
  if (!lastQrBase64) return null;
  if (lastQrExpiresAt && new Date() > lastQrExpiresAt) return null;
  return lastQrBase64;
};

/**
 * Kirim pesan WhatsApp ke nomor tujuan.
 */
export const sendWaMessage = async (
  phone: string,
  message: string,
): Promise<{ success: boolean; error?: string }> => {
  if (!waClient || clientStatus !== "ready") {
    return {
      success: false,
      error: "WA client belum siap. Pastikan sudah scan QR.",
    };
  }

  if (!phone || phone.trim() === "") {
    return { success: false, error: "Nomor tujuan kosong." };
  }

  try {
    let normalizedPhone = phone.replace(/\D/g, "");
    if (normalizedPhone.startsWith("0")) {
      normalizedPhone = "62" + normalizedPhone.slice(1);
    }

    const chatId = `${normalizedPhone}@c.us`;
    console.log(`[WA] Attempting to send message to: ${chatId}`);

    await waClient.sendMessage(chatId, message);
    return { success: true };
  } catch (err: any) {
    const errorMsg = err.message || JSON.stringify(err);
    console.error("[WA] Send message error details:", errorMsg);
    
    return { 
      success: false, 
      error: errorMsg === "t" ? "Format nomor tidak valid atau nomor tidak terdaftar di WhatsApp." : errorMsg 
    };
  }
};

export const triggerWaNotificationIfNeeded = async (
  sparePartId: number,
  currentStock: number,
): Promise<void> => {
  try {
    const part = await prisma.spare_parts.findUnique({
      where: { id: sparePartId },
      select: { name: true, sku: true, minimum_stock: true, unit: true },
    });

    if (!part || currentStock > part.minimum_stock) return;

    const settings = await prisma.bengkel_profile.findFirst({
      select: {
        id: true,
        wa_target_number: true,
        wa_bot_enabled: true,
        wa_template_stok: true,
      },
    });

    if (!settings?.wa_target_number || settings.wa_bot_enabled === false) return;

    const defaultMessage =
      `⚠️ *Stok Menipis!*\n\n` +
      `Item: *${part.name}*\n` +
      `SKU: ${part.sku}\n` +
      `Stok Saat Ini: *${currentStock} ${part.unit ?? "pcs"}*\n` +
      `Minimum Stok: ${part.minimum_stock} ${part.unit ?? "pcs"}\n\n` +
      `Segera lakukan restock!`;

    let message = defaultMessage;

    if (settings.wa_template_stok) {
      message = settings.wa_template_stok
        .replace(/{{item}}/g, part.name)
        .replace(/{{sku}}/g, part.sku)
        .replace(/{{stock}}/g, `${currentStock} ${part.unit ?? "pcs"}`)
        .replace(/{{min}}/g, `${part.minimum_stock} ${part.unit ?? "pcs"}`);
    }

    // Simpan log notifikasi (default pending)
    await prisma.wa_notifications.create({
      data: {
        spare_part_id: sparePartId,
        wa_number: settings.wa_target_number,
        message_body: message,
        status: "pending",
      },
    });
  } catch (err) {
    console.error("[WA] triggerWaNotificationIfNeeded error:", err);
  }
};

/**
 * Kirim notifikasi progress servis ke nomor WA pelanggan.
 */
export const sendServiceProgressNotification = async (
  customerPhone: string,
  vehiclePlate: string,
  newStatus: string,
  workOrderId: number,
): Promise<void> => {
  try {
    const settings = await prisma.bengkel_profile.findFirst({
      select: {
        id: true,
        wa_bot_enabled: true,
        wa_template_dikerjakan: true,
        wa_template_selesai: true,
      },
    });

    if (settings?.wa_bot_enabled === false) return;

    const defaultMessages: Record<string, string> = {
      dikerjakan:
        `🔧 *Update Kendaraan Anda*\n\n` +
        `Kendaraan dengan nomor polisi *${vehiclePlate}* sedang dalam pengerjaan.\n` +
        `Tim mekanik kami sedang menangani kendaraan Anda.\n\n` +
        `Terima kasih telah mempercayakan kendaraan Anda kepada kami! 🙏`,
      selesai:
        `✅ *Kendaraan Siap Diambil!*\n\n` +
        `Kendaraan dengan nomor polisi *${vehiclePlate}* telah selesai dikerjakan dan siap untuk diambil.\n\n` +
        `Silakan datang ke bengkel untuk mengambil kendaraan Anda.\n` +
        `Terima kasih! 🚗`,
    };

    let message = defaultMessages[newStatus];
    if (newStatus === "dikerjakan" && settings?.wa_template_dikerjakan) {
      message = settings.wa_template_dikerjakan.replace(
        /{{plate}}|{{no_polisi}}/g,
        vehiclePlate,
      );
    } else if (newStatus === "selesai" && settings?.wa_template_selesai) {
      message = settings.wa_template_selesai.replace(
        /{{plate}}|{{no_polisi}}/g,
        vehiclePlate,
      );
    }

    if (!message) return;

    // Simpan log notifikasi (pending) agar diproses worker
    await prisma.wa_notifications.create({
      data: {
        spare_part_id: null,
        wa_number: customerPhone,
        message_body: message,
        status: "pending",
      },
    });
  } catch (err) {
    console.error("[WA] sendServiceProgressNotification error:", err);
  }
};
