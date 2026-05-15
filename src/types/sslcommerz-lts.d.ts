declare module 'sslcommerz-lts' {
  export interface SSLCInitData {
    total_amount: number;
    currency: string;
    tran_id: string;
    success_url: string;
    fail_url: string;
    cancel_url: string;
    ipn_url: string;
    shipping_method: string;
    product_name: string;
    product_category: string;
    product_profile: string;
    cus_name: string;
    cus_email: string;
    cus_add1: string;
    cus_city: string;
    cus_country: string;
    cus_phone: string;
    ship_name: string;
    ship_add1: string;
    ship_city: string;
    ship_postcode: number | string;
    ship_country: string;
    [key: string]: unknown;
  }

  export interface SSLCInitResponse {
    status: string;
    failedreason?: string;
    GatewayPageURL?: string;
    sessionkey?: string;
    [key: string]: unknown;
  }

  export interface SSLCValidateResponse {
    status: string;
    tran_id?: string;
    val_id?: string;
    amount?: string;
    store_amount?: string;
    currency?: string;
    bank_tran_id?: string;
    [key: string]: unknown;
  }

  export interface SSLCCallbackPayload {
    tran_id?: string;
    val_id?: string;
    amount?: string;
    currency?: string;
    store_amount?: string;
    status?: string;
    bank_tran_id?: string;
    [key: string]: unknown;
  }

  class SSLCommerzPayment {
    constructor(store_id: string, store_passwd: string, is_live: boolean);
    init(data: SSLCInitData): Promise<SSLCInitResponse>;
    validate(data: { val_id: string }): Promise<SSLCValidateResponse>;
  }

  export = SSLCommerzPayment;
}
