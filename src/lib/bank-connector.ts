import type { BankAccount, Transaction } from "@/types/finance";
import { mockAccounts, mockTransactions } from "@/lib/mock-data";

export interface BankConnector {
  isLive: boolean;
  getAccounts(): Promise<BankAccount[]>;
  getTransactions(params?: { accountId?: string; since?: string }): Promise<Transaction[]>;
}

/**
 * Stand-in for a real bank feed. Swap this for an Australian Open Banking
 * (Consumer Data Right) connector — e.g. Basiq or Frollo — once you're ready
 * to link a real account: implement BankConnector against their API and
 * change the export below. Nothing else in the app depends on the source.
 */
class MockBankConnector implements BankConnector {
  isLive = false;

  async getAccounts(): Promise<BankAccount[]> {
    return mockAccounts;
  }

  async getTransactions(params?: { accountId?: string; since?: string }): Promise<Transaction[]> {
    let txns = mockTransactions;
    if (params?.accountId) {
      txns = txns.filter((t) => t.accountId === params.accountId);
    }
    if (params?.since) {
      txns = txns.filter((t) => t.date >= params.since!);
    }
    return txns;
  }
}

export const bankConnector: BankConnector = new MockBankConnector();
