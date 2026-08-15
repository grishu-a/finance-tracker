export type TransactionType = "income" | "expense";
export type PaymentMethod = "cash" | "card" | "digital_wallet" | "bank_transfer";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; display_name: string; created_at: string };
        Insert: { id: string; display_name: string; created_at?: string };
        Update: { display_name?: string };
        Relationships: [];
      };
      categories: {
        Row: { id: string; name: string; sort_order: number };
        Insert: { id?: string; name: string; sort_order?: number };
        Update: { name?: string; sort_order?: number };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: TransactionType;
          amount: number;
          category_id: string;
          payment_method: PaymentMethod;
          txn_date: string;
          note: string | null;
          is_shared: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: TransactionType;
          amount: number;
          category_id: string;
          payment_method: PaymentMethod;
          txn_date: string;
          note?: string | null;
          is_shared?: boolean;
        };
        Update: {
          type?: TransactionType;
          amount?: number;
          category_id?: string;
          payment_method?: PaymentMethod;
          txn_date?: string;
          note?: string | null;
          is_shared?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      transaction_participants: {
        Row: {
          id: string;
          transaction_id: string;
          participant_id: string;
          share_amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          transaction_id: string;
          participant_id: string;
          share_amount: number;
        };
        Update: { share_amount?: number };
        Relationships: [
          {
            foreignKeyName: "transaction_participants_transaction_id_fkey";
            columns: ["transaction_id"];
            isOneToOne: false;
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transaction_participants_participant_id_fkey";
            columns: ["participant_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      settlements: {
        Row: {
          id: string;
          payer_id: string;
          payee_id: string;
          amount: number;
          note: string | null;
          created_by: string;
          settled_at: string;
        };
        Insert: {
          id?: string;
          payer_id: string;
          payee_id: string;
          amount: number;
          note?: string | null;
          created_by: string;
        };
        Update: { amount?: number; note?: string | null };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
