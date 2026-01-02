
export enum Language {
  AMHARIC = 'am',
  ENGLISH = 'en'
}

export type TeffType = 'White' | 'Red' | 'Mixed';

export interface Merchant {
  id: string;
  name: string;
  location: string;
  phone: string;
  bankAccounts: { bankName: string; accountNumber: string; holderName: string }[];
  stock: {
    [key in TeffType]: number; // in kilos
  };
  prices: {
    [key in TeffType]: number; // per kilo in ETB
  };
}

export interface Order {
  id: string;
  merchantId: string;
  items: { type: TeffType; quantity: number; price: number }[];
  totalPrice: number;
  status: 'Pending' | 'Paid' | 'Delivered';
  customerName: string;
  customerPhone: string;
}

export interface Translation {
  title: string;
  heroTitle: string;
  heroSub: string;
  merchantLogin: string;
  merchantRegister: string;
  browseTeff: string;
  buyNow: string;
  kilo: string;
  pricePerKilo: string;
  totalPrice: string;
  whiteTeff: string;
  redTeff: string;
  mixedTeff: string;
  paymentInstructions: string;
  bankAccount: string;
  accountNumber: string;
  stockAvailable: string;
  noStock: string;
  quantity: string;
  placeOrder: string;
  paymentNotice: string;
  merchantDashboard: string;
  updateStock: string;
  logout: string;
  aiAssistant: string;
  aiPlaceholder: string;
  cart: string;
  checkout: string;
  continueShopping: string;
  cartEmpty: string;
  addToCart: string;
  remove: string;
  proceedToCheckout: string;
  customerInformation: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  kebele: string;
  googleMapsLink: string;
  paymentProof: string;
  required: string;
  optional: string;
  placingOrder: string;
  orderSummary: string;
  orderPlaced: string;
  adminDashboard: string;
  allOrders: string;
  merchantBreakdown: string;
  assignToMerchants: string;
  markAsCompleted: string;
  notificationMethod: string;
  dashboardMessage: string;
  phoneCall: string;
  both: string;
  selectMerchants: string;
  cancel: string;
  assign: string;
  orders: string;
  products: string;
  notifications: string;
  new: string;
  noOrders: string;
  noNotifications: string;
  markAllAsRead: string;
  confirmOrder: string;
  confirm: string;
  customer: string;
  status: string;
  amount: string;
  items: string;
  pending: string;
  assigned: string;
  completed: string;
  confirmed: string;
  myAmount: string;
  myItems: string;
  myProducts: string;
  stock: string;
  price: string;
  viewOnMap: string;
  subtotal: string;
  addMerchant: string;
  deleteMerchant: string;
  editMerchant: string;
  merchants: string;
  password: string;
  storeLocation: string;
  photoUrl: string;
  delivery: string;
  vatIncluded: string;
  fastDelivery: string;
  secureTransaction: string;
  minOrder: string;
  refreshData: string;
  lastSynced: string;
  searchItems: string;
  calculatedAtNextStep: string;
  syncingCart: string;
  cartDescription: string;
  secureNotice: string;
  addisDeliveryTime: string;
  activeOrders: string;
  totalRevenue: string;
  unreadAlerts: string;
  teffTypes: string;
  inventory: string;
  addGrains: string;
  callCustomer: string;
  welcomeBack: string;
  noOrdersDescription: string;
  noNotificationsDescription: string;
  commitToInventory: string;
  teffTypeSelection: string;
  pricePerKiloLabel: string;
  availableStockLabel: string;
  detailedDescription: string;
  descriptionPlaceholder: string;
  exploreMarket: string;
  allTypes: string;
  verifiedMerchant: string;
  availableWeight: string;
  perKilo: string;
  popularTeff: string;
  fastDeliveryTitle: string;
  trustedMerchantsTitle: string;
  qualityGuaranteedTitle: string;
  howItWorks: string;
  step1Title: string;
  step2Title: string;
  step3Title: string;
  footerAbout: string;
  legal: string;
  termsOfService: string;
  privacyPolicy: string;
}
