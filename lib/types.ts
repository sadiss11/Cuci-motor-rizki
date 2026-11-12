export type Role = "owner" | "kasir";
export type Size = "kecil" | "sedang" | "besar";
export type OrderStatus = "baru" | "diproses" | "selesai" | "batal";
export type PayMethod = "tunai" | "transfer" | "qris" | "voucher";
export type PayStatus = "belum" | "lunas" | "refund";

export interface Service {
  id: string;
  name: string;
  duration: string;
  prices: Record<Size, number>;
  note?: string;
  active: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string; // format 62xxxxxxxxx
  createdAt: string;
}

export interface Order {
  id: string;
  invoiceNo: string;
  token: string; // token acak untuk invoice publik
  createdAt: string;
  createdBy: Role;
  customerId?: string;
  customerName: string;
  plate: string;
  serviceId: string;
  serviceName: string;
  size: Size;
  price: number;
  discount: number;
  total: number;
  voucherId?: string;
  payMethod: PayMethod;
  payStatus: PayStatus;
  received: number;
  paidAt?: string;
  status: OrderStatus;
  doneAt?: string;
}

export type CashCategory =
  | "transaksi"
  | "pemasukan lain"
  | "sabun"
  | "bahan poles"
  | "gaji"
  | "listrik"
  | "sewa"
  | "lain-lain";

export interface CashEntry {
  id: string;
  date: string; // ISO
  type: "masuk" | "keluar";
  category: CashCategory;
  amount: number;
  note: string;
  pic: string;
  source: "order" | "manual";
  orderId?: string;
  voided?: { at: string; by: Role; reason: string };
  createdBy: Role;
}

export interface LoyaltyEvent {
  id: string;
  customerId: string;
  orderId: string;
  at: string;
  revokedAt?: string;
}

export interface LoyaltyReward {
  id: string;
  customerId: string;
  serviceId: string;
  issuedAt: string;
  usedOrderId?: string;
  usedAt?: string;
}

export interface PromoConsent {
  customerId: string;
  granted: boolean;
  at: string;
  source: string; // mis. "kasir - lisan", "formulir"
}

export interface AuditLog {
  id: string;
  at: string;
  by: Role;
  action: string;
  detail: string;
}

export interface Settings {
  businessName: string;
  businessWa: string;
  address: string;
  loyaltyThreshold: number;
  loyaltyRewardServiceId: string;
  promoTemplate: string;
  pins: Record<Role, string>;
}

export interface DB {
  version: number;
  settings: Settings;
  services: Service[];
  customers: Customer[];
  orders: Order[];
  cash: CashEntry[];
  loyaltyEvents: LoyaltyEvent[];
  loyaltyRewards: LoyaltyReward[];
  consents: PromoConsent[];
  audit: AuditLog[];
  seq: number;
}
