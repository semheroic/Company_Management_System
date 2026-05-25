import UniversalTransactionService from './universalTransactionService';
import TransactionEngine from './transactionEngine';
import AuditLogService from './auditLogService';
import DataIntegrationService from './dataIntegrationService';
import AccountingBooksService from './accountingBooksService';
import InvoiceRegisterService from './invoiceRegisterService';
import { resolveCompanyId } from './companyApi';

export interface TransactionRequest {
  type:
    | 'sale'
    | 'purchase'
    | 'expense'
    | 'income'
    | 'salary'
    | 'capital_contribution'
    | 'capital_withdrawal'
    | 'share_issuance'
    | 'dividend_declaration'
    | 'dividend_payment'
    | 'equity_adjustment'
    | 'asset_acquisition'
    | 'transfer';
  amount: number;
  description: string;
  date: string;
  payment_method: 'cash' | 'bank' | 'mobile_money' | 'card' | 'cheque';
  payment_status: 'paid' | 'unpaid' | 'partially_paid';
  paid_amount?: number;
  due_date?: string;
  party_name?: string;
  reference_number?: string;
  supporting_documents?: string[];
  additional_data?: Record<string, unknown>;
}

export interface TransactionResponse {
  success: boolean;
  transaction_id: string;
  accounting_entries: JournalEntry[];
  errors?: string[];
  warnings?: string[];
}

export interface JournalEntry {
  account: string;
  account_code: string;
  debit?: number;
  credit?: number;
  description: string;
}

class UniversalTransactionHandler {
  static async processTransaction(request: TransactionRequest): Promise<TransactionResponse> {
    const warnings: string[] = [];
    let transaction_id = '';
    let accounting_entries: JournalEntry[] = [];

    try {
      const validation = this.validateTransaction(request);
      if (!validation.isValid) {
        return {
          success: false,
          transaction_id: '',
          accounting_entries: [],
          errors: validation.errors,
        };
      }

      const companyId = await resolveCompanyId();

      const utsTransaction = UniversalTransactionService.createTransaction(
        {
          type: request.type,
          amount: request.amount,
          description: request.description,
          date: request.date,
          payment_method: request.payment_method,
          reference_number: request.reference_number,
          status: 'confirmed',
          company_id: companyId,
          ...request.additional_data,
        },
        {
          skipAccountingPost: true,
        },
      );

      transaction_id = utsTransaction.id;
      accounting_entries = await this.generateAccountingEntries(request);

      if (accounting_entries.length < 2) {
        throw new Error(`No accounting entries were generated for ${request.type}`);
      }

      const reference = request.reference_number || `REF-${transaction_id}`;
      const analyticsPartyName =
        request.party_name ||
        String(
          request.additional_data?.client ||
          request.additional_data?.supplier ||
          request.additional_data?.shareholder_name ||
          "",
        ) ||
        undefined;

      await AccountingBooksService.syncGeneratedTransaction(
        {
          date: request.date,
          description: request.description,
          reference,
          source_type: request.type,
          source_id: transaction_id,
          metadata: {
            amount: request.amount,
            party_name: analyticsPartyName,
            payment_method: request.payment_method,
            payment_status: request.payment_status,
            income_source: String(request.additional_data?.income_source || "") || undefined,
            tax_category: String(request.additional_data?.tax_category || "") || undefined,
          },
          entries: accounting_entries.map((entry) => ({
            account_code: entry.account_code,
            account_name: entry.account,
            debit: entry.debit || 0,
            credit: entry.credit || 0,
          })),
        },
        companyId,
      );

      try {
        TransactionEngine.postTransaction({
          date: request.date,
          reference,
          description: request.description,
          source_id: transaction_id,
          source_type: this.mapToTransactionEngineType(request.type),
          entries: accounting_entries.map((entry) => ({
            account_code: entry.account_code,
            account_name: entry.account,
            debit: entry.debit || 0,
            credit: entry.credit || 0,
          })),
        });
      } catch (error) {
        console.error('Local transaction mirror failed:', error);
        warnings.push('Transaction was posted, but the local analytics cache could not be updated immediately.');
      }

      warnings.push(...await this.syncRelatedModules(request, transaction_id, accounting_entries, companyId));

      try {
        AuditLogService.logAction({
          action_type: 'create',
          table_name: 'transactions',
          record_id: transaction_id,
          description: `Transaction processed: ${request.type} - ${request.description}`,
          new_data: request,
        });
      } catch (error) {
        console.error('Audit log update failed:', error);
        warnings.push('Transaction was posted, but the audit trail entry could not be saved.');
      }

      try {
        DataIntegrationService.syncAllData();
      } catch (error) {
        console.error('Data integration refresh failed:', error);
        warnings.push('Transaction was posted, but some dashboards may need a manual refresh.');
      }

      return {
        success: true,
        transaction_id,
        accounting_entries,
        warnings,
      };
    } catch (error) {
      if (transaction_id) {
        UniversalTransactionService.deleteTransaction(transaction_id);
      }

      console.error('Transaction processing error:', error);
      return {
        success: false,
        transaction_id,
        accounting_entries: [],
        errors: [`Failed to process transaction: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  private static validateTransaction(request: TransactionRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.amount || request.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!request.description || request.description.trim() === '') {
      errors.push('Description is required');
    }

    if (!request.date) {
      errors.push('Date is required');
    }

    if (!request.type) {
      errors.push('Transaction type is required');
    }

    if (request.payment_status === 'partially_paid') {
      const paidAmount = Number(request.paid_amount || 0);
      if (paidAmount <= 0 || paidAmount >= request.amount) {
        errors.push('Partially paid transactions require a paid amount that is greater than 0 and less than the total amount');
      }
    }

    if (
      ['capital_contribution', 'capital_withdrawal', 'share_issuance'].includes(request.type) &&
      !request.additional_data?.shareholder_id
    ) {
      errors.push('Shareholder ID is required for capital transactions');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private static async generateAccountingEntries(request: TransactionRequest): Promise<JournalEntry[]> {
    const entries: JournalEntry[] = [];

    switch (request.type) {
      case 'capital_contribution':
        this.handleCapitalContribution(request, entries);
        break;
      case 'capital_withdrawal':
        this.handleCapitalWithdrawal(request, entries);
        break;
      case 'share_issuance':
        this.handleShareIssuance(request, entries);
        break;
      case 'dividend_declaration':
        this.handleDividendDeclaration(request, entries);
        break;
      case 'dividend_payment':
        this.handleDividendPayment(request, entries);
        break;
      case 'equity_adjustment':
        this.handleEquityAdjustment(request, entries);
        break;
      case 'transfer':
        this.handleTransfer(request, entries);
        break;
      case 'sale':
        this.handleSaleTransaction(request, entries);
        break;
      case 'purchase':
        this.handlePurchaseTransaction(request, entries);
        break;
      case 'expense':
        this.handleExpenseTransaction(request, entries);
        break;
      case 'income':
        this.handleIncomeTransaction(request, entries);
        break;
      case 'salary':
        this.handleSalaryTransaction(request, entries);
        break;
      case 'asset_acquisition':
        this.handleAssetAcquisitionTransaction(request, entries);
        break;
      default:
        throw new Error(`Unsupported transaction type: ${request.type}`);
    }

    const totalDebits = entries.reduce((sum, entry) => sum + Number(entry.debit || 0), 0);
    const totalCredits = entries.reduce((sum, entry) => sum + Number(entry.credit || 0), 0);
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      throw new Error('Generated transaction does not balance');
    }

    return entries;
  }

  private static handleCapitalContribution(request: TransactionRequest, entries: JournalEntry[]): void {
    entries.push({
      account: request.payment_method === 'cash' ? 'Petty Cash' : 'Cash at Bank',
      account_code: request.payment_method === 'cash' ? '1002' : '1001',
      debit: request.amount,
      description: 'Capital contribution received',
    });
    entries.push({
      account: 'Share Capital',
      account_code: '3000',
      credit: request.amount,
      description: `Capital contribution from ${request.additional_data?.shareholder_name || 'shareholder'}`,
    });
  }

  private static handleCapitalWithdrawal(request: TransactionRequest, entries: JournalEntry[]): void {
    entries.push({
      account: 'Owner Drawings',
      account_code: '3002',
      debit: request.amount,
      description: 'Capital withdrawal by owner',
    });
    entries.push({
      account: request.payment_method === 'cash' ? 'Petty Cash' : 'Cash at Bank',
      account_code: request.payment_method === 'cash' ? '1002' : '1001',
      credit: request.amount,
      description: 'Cash paid for capital withdrawal',
    });
  }

  private static handleShareIssuance(request: TransactionRequest, entries: JournalEntry[]): void {
    const shareValue = Number(request.additional_data?.par_value || 1000);
    const totalShares = Math.floor(request.amount / shareValue);
    const shareCapital = totalShares * shareValue;
    const sharePremium = request.amount - shareCapital;

    entries.push({
      account: request.payment_method === 'cash' ? 'Petty Cash' : 'Cash at Bank',
      account_code: request.payment_method === 'cash' ? '1002' : '1001',
      debit: request.amount,
      description: 'Share issuance proceeds',
    });
    entries.push({
      account: 'Share Capital',
      account_code: '3000',
      credit: shareCapital,
      description: `${totalShares} shares issued at par value`,
    });

    if (sharePremium > 0) {
      entries.push({
        account: 'Equity Adjustment',
        account_code: '3003',
        credit: sharePremium,
        description: 'Share premium on issuance',
      });
    }
  }

  private static handleDividendDeclaration(request: TransactionRequest, entries: JournalEntry[]): void {
    entries.push({
      account: 'Retained Earnings',
      account_code: '3001',
      debit: request.amount,
      description: 'Dividend declared',
    });
    entries.push({
      account: 'Dividend Payable',
      account_code: '2104',
      credit: request.amount,
      description: 'Dividend payable to shareholders',
    });
  }

  private static handleDividendPayment(request: TransactionRequest, entries: JournalEntry[]): void {
    entries.push({
      account: 'Dividend Payable',
      account_code: '2104',
      debit: request.amount,
      description: 'Dividend payment made',
    });
    entries.push({
      account: request.payment_method === 'cash' ? 'Petty Cash' : 'Cash at Bank',
      account_code: request.payment_method === 'cash' ? '1002' : '1001',
      credit: request.amount,
      description: 'Cash paid for dividends',
    });
  }

  private static handleSaleTransaction(request: TransactionRequest, entries: JournalEntry[]): void {
    const clientName = request.party_name || request.additional_data?.client || 'Customer';

    if (request.payment_status === 'paid') {
      entries.push({
        account: request.payment_method === 'cash' ? 'Petty Cash' : 'Cash at Bank',
        account_code: request.payment_method === 'cash' ? '1002' : '1001',
        debit: request.amount,
        description: `Cash sale - ${clientName}`,
      });
      entries.push({
        account: 'Sales Revenue',
        account_code: '4001',
        credit: request.amount,
        description: `Sale to ${clientName}`,
      });
      return;
    }

    if (request.payment_status === 'unpaid') {
      entries.push({
        account: 'Accounts Receivable',
        account_code: '1101',
        debit: request.amount,
        description: `Credit sale - ${clientName}`,
      });
      entries.push({
        account: 'Sales Revenue',
        account_code: '4001',
        credit: request.amount,
        description: `Credit sale to ${clientName}`,
      });
      return;
    }

    const paidAmount = Number(request.paid_amount || 0);
    const remainingAmount = request.amount - paidAmount;

    entries.push({
      account: request.payment_method === 'cash' ? 'Petty Cash' : 'Cash at Bank',
      account_code: request.payment_method === 'cash' ? '1002' : '1001',
      debit: paidAmount,
      description: `Partial payment - ${clientName}`,
    });
    entries.push({
      account: 'Accounts Receivable',
      account_code: '1101',
      debit: remainingAmount,
      description: `Outstanding balance - ${clientName}`,
    });
    entries.push({
      account: 'Sales Revenue',
      account_code: '4001',
      credit: request.amount,
      description: `Sale to ${clientName}`,
    });
  }

  private static handlePurchaseTransaction(request: TransactionRequest, entries: JournalEntry[]): void {
    const supplierName = request.party_name || request.additional_data?.supplier || 'Supplier';
    const expenseAccount = request.additional_data?.expense_account || 'General Expenses';
    const expenseAccountCode = request.additional_data?.expense_account_code || '5001';

    if (request.payment_status === 'paid') {
      entries.push({
        account: expenseAccount,
        account_code: expenseAccountCode,
        debit: request.amount,
        description: `Purchase from ${supplierName}`,
      });
      entries.push({
        account: request.payment_method === 'cash' ? 'Petty Cash' : 'Cash at Bank',
        account_code: request.payment_method === 'cash' ? '1002' : '1001',
        credit: request.amount,
        description: `Cash payment to ${supplierName}`,
      });
      return;
    }

    if (request.payment_status === 'unpaid') {
      entries.push({
        account: expenseAccount,
        account_code: expenseAccountCode,
        debit: request.amount,
        description: `Credit purchase from ${supplierName}`,
      });
      entries.push({
        account: 'Accounts Payable',
        account_code: '2001',
        credit: request.amount,
        description: `Amount owed to ${supplierName}`,
      });
      return;
    }

    const paidAmount = Number(request.paid_amount || 0);
    const remainingAmount = request.amount - paidAmount;

    entries.push({
      account: expenseAccount,
      account_code: expenseAccountCode,
      debit: request.amount,
      description: `Purchase from ${supplierName}`,
    });
    entries.push({
      account: request.payment_method === 'cash' ? 'Petty Cash' : 'Cash at Bank',
      account_code: request.payment_method === 'cash' ? '1002' : '1001',
      credit: paidAmount,
      description: `Partial payment to ${supplierName}`,
    });
    entries.push({
      account: 'Accounts Payable',
      account_code: '2001',
      credit: remainingAmount,
      description: `Outstanding balance to ${supplierName}`,
    });
  }

  private static handleExpenseTransaction(request: TransactionRequest, entries: JournalEntry[]): void {
    const paymentAccount = this.getPaymentAccount(request.payment_method);
    const expenseAccount = request.additional_data?.expense_account || 'Other Expenses';
    const expenseAccountCode = request.additional_data?.expense_account_code || '5008';

    entries.push({
      account: expenseAccount,
      account_code: expenseAccountCode,
      debit: request.amount,
      description: request.description,
    });
    entries.push({
      account: paymentAccount.name,
      account_code: paymentAccount.code,
      credit: request.amount,
      description: `Payment for ${request.description.toLowerCase()}`,
    });
  }

  private static handleIncomeTransaction(request: TransactionRequest, entries: JournalEntry[]): void {
    const paymentAccount = this.getPaymentAccount(request.payment_method);
    const isSalesIncome = request.additional_data?.income_source === 'sales';
    const incomeAccount = request.additional_data?.income_account || (isSalesIncome ? 'Sales Revenue' : 'Other Income');
    const incomeAccountCode = request.additional_data?.income_account_code || (isSalesIncome ? '4001' : '4003');

    entries.push({
      account: paymentAccount.name,
      account_code: paymentAccount.code,
      debit: request.amount,
      description: `Funds received for ${request.description.toLowerCase()}`,
    });
    entries.push({
      account: incomeAccount,
      account_code: incomeAccountCode,
      credit: request.amount,
      description: request.description,
    });
  }

  private static handleSalaryTransaction(request: TransactionRequest, entries: JournalEntry[]): void {
    const grossSalary = Number(request.additional_data?.gross_salary || request.amount);
    const payeTax = Number(request.additional_data?.paye_deduction || 0);
    const rssbEmployee = Number(request.additional_data?.rssb_employee || 0);
    const rssbEmployer = Number(request.additional_data?.rssb_employer || 0);

    entries.push({
      account: 'Salaries & Wages',
      account_code: '5002',
      debit: grossSalary + rssbEmployer,
      description: 'Salary expense including employer contributions',
    });
    entries.push({
      account: 'Cash at Bank',
      account_code: '1001',
      credit: request.amount,
      description: 'Net salary paid',
    });

    if (payeTax > 0) {
      entries.push({
        account: 'PAYE Payable',
        account_code: '2102',
        credit: payeTax,
        description: 'PAYE tax withheld',
      });
    }

    if (rssbEmployee + rssbEmployer > 0) {
      entries.push({
        account: 'RSSB Payable',
        account_code: '2103',
        credit: rssbEmployee + rssbEmployer,
        description: 'RSSB contributions payable',
      });
    }
  }

  private static handleAssetAcquisitionTransaction(request: TransactionRequest, entries: JournalEntry[]): void {
    const paymentAccount = this.getPaymentAccount(request.payment_method);
    const assetAccount = request.additional_data?.asset_account || 'Fixed Assets';
    const assetAccountCode = request.additional_data?.asset_account_code || '1301';

    entries.push({
      account: assetAccount,
      account_code: assetAccountCode,
      debit: request.amount,
      description: request.description,
    });
    entries.push({
      account: paymentAccount.name,
      account_code: paymentAccount.code,
      credit: request.amount,
      description: 'Payment for asset acquisition',
    });
  }

  private static handleEquityAdjustment(request: TransactionRequest, entries: JournalEntry[]): void {
    const adjustmentType = request.additional_data?.adjustment_type || 'correction';
    const fromAccount = request.additional_data?.from_account || 'Retained Earnings';
    const toAccount = request.additional_data?.to_account || 'Equity Adjustment';

    entries.push({
      account: fromAccount,
      account_code: this.getAccountCode(fromAccount),
      debit: request.amount,
      description: `Equity adjustment: ${adjustmentType}`,
    });
    entries.push({
      account: toAccount,
      account_code: this.getAccountCode(toAccount),
      credit: request.amount,
      description: `Equity adjustment: ${adjustmentType}`,
    });
  }

  private static getAccountCode(accountName: string): string {
    const accountCodes: Record<string, string> = {
      'Retained Earnings': '3001',
      'Equity Adjustment': '3003',
      'Share Capital': '3000',
      'Share Premium': '3003',
      'Owner Drawings': '3002',
    };
    return accountCodes[accountName] || '3999';
  }

  private static handleTransfer(request: TransactionRequest, entries: JournalEntry[]): void {
    const fromAccount = request.additional_data?.from_account || 'Cash on Hand';
    const toAccount = request.additional_data?.to_account || 'Bank';

    entries.push({
      account: toAccount,
      account_code: this.getAccountCodeForTransfer(toAccount),
      debit: request.amount,
      description: `Transfer from ${fromAccount} to ${toAccount}`,
    });
    entries.push({
      account: fromAccount,
      account_code: this.getAccountCodeForTransfer(fromAccount),
      credit: request.amount,
      description: `Transfer from ${fromAccount} to ${toAccount}`,
    });
  }

  private static getAccountCodeForTransfer(accountName: string): string {
    const transferAccountCodes: Record<string, string> = {
      'Cash on Hand': '1002',
      'Petty Cash': '1002',
      'Cash at Bank': '1001',
      Bank: '1001',
      'KCB Bank': '1001',
      'Equity Bank': '1001',
      'MoMo Wallet': '1003',
      'Airtel Money': '1003',
      'Mobile Money': '1003',
    };
    return transferAccountCodes[accountName] || '1001';
  }

  private static getPaymentAccount(paymentMethod: TransactionRequest['payment_method']): { code: string; name: string } {
    switch (paymentMethod) {
      case 'cash':
        return { code: '1002', name: 'Petty Cash' };
      case 'mobile_money':
        return { code: '1003', name: 'Mobile Money Account' };
      case 'bank':
      case 'card':
      case 'cheque':
      default:
        return { code: '1001', name: 'Cash at Bank' };
    }
  }

  private static async syncRelatedModules(
    request: TransactionRequest,
    transactionId: string,
    entries: JournalEntry[],
    companyId: string,
  ): Promise<string[]> {
    const warnings: string[] = [];

    if (request.type === 'sale' || request.type === 'purchase') {
      try {
        const vatEntry = entries.find((entry) => entry.account_code === '2101' || entry.account_code === '1002');
        const registerType = request.type === 'sale' ? 'invoice' : 'receipt';
        const partyName =
          request.party_name || request.additional_data?.client || request.additional_data?.supplier || 'Unknown Party';

        await InvoiceRegisterService.syncTransaction(
          {
            transaction_id: transactionId,
            type: registerType,
            number: request.additional_data?.invoice_number || request.reference_number,
            party_name: partyName,
            tin: request.additional_data?.tin,
            description: request.description,
            amount: request.amount,
            vat: vatEntry?.credit || vatEntry?.debit || 0,
            total: request.amount,
            date: request.date,
            due_date: request.due_date,
            status: request.payment_status,
            payment_method: request.payment_method,
            phone_number: request.additional_data?.phone_number,
            momo_reference: request.additional_data?.momo_reference,
            tax_category: request.additional_data?.tax_category,
          },
          companyId,
        );
      } catch (error) {
        console.error('Invoice register sync failed:', error);
        warnings.push('The ledger was updated, but the invoice register could not be refreshed automatically.');
      }
    }

    if (request.type === 'capital_contribution' || request.type === 'share_issuance') {
      warnings.push(...await this.syncCapitalRecords(request, companyId));
    }

    return warnings;
  }

  private static async syncCapitalRecords(request: TransactionRequest, companyId: string): Promise<string[]> {
    try {
      const { default: CompanyCapitalService } = await import('./companyCapitalService');
      const parValue = Number(request.additional_data?.par_value || 1000);
      const sharesAllocated =
        request.type === 'share_issuance'
          ? Math.floor(request.amount / parValue)
          : Number(request.additional_data?.shares_allocated || 0);

      CompanyCapitalService.addCapitalContribution({
        shareholder_id: request.additional_data?.shareholder_id,
        shareholder_name: request.additional_data?.shareholder_name,
        amount: request.amount,
        shares_allocated: sharesAllocated,
        contribution_type: request.payment_method === 'cash' ? 'cash' : 'bank_transfer',
        contribution_date: request.date,
        description:
          request.type === 'share_issuance'
            ? `Share issuance: ${sharesAllocated} shares`
            : request.description,
        status: 'confirmed',
        company_id: companyId,
      });

      return [];
    } catch (error) {
      console.error('Capital register sync failed:', error);
      return ['The ledger was updated, but the local capital analytics cache could not be refreshed.'];
    }
  }

  private static mapToTransactionEngineType(
    transactionType: TransactionRequest['type'],
  ): 'invoice' | 'purchase' | 'payroll' | 'asset' | 'payment' | 'manual' {
    const typeMapping: Record<TransactionRequest['type'], 'invoice' | 'purchase' | 'payroll' | 'asset' | 'payment' | 'manual'> = {
      sale: 'invoice',
      purchase: 'purchase',
      expense: 'payment',
      income: 'invoice',
      salary: 'payroll',
      capital_contribution: 'manual',
      capital_withdrawal: 'manual',
      share_issuance: 'manual',
      dividend_declaration: 'manual',
      dividend_payment: 'payment',
      equity_adjustment: 'manual',
      asset_acquisition: 'asset',
      transfer: 'manual',
    };

    return typeMapping[transactionType] || 'manual';
  }

  static async getTransactionHistory(filters?: {
    type?: string;
    date_from?: string;
    date_to?: string;
    amount_min?: number;
    amount_max?: number;
  }) {
    const transactions = UniversalTransactionService.getAllTransactions();
    let filtered = transactions;

    if (filters) {
      if (filters.type) {
        filtered = filtered.filter((transaction) => transaction.type === filters.type);
      }
      if (filters.date_from) {
        filtered = filtered.filter((transaction) => transaction.date >= filters.date_from!);
      }
      if (filters.date_to) {
        filtered = filtered.filter((transaction) => transaction.date <= filters.date_to!);
      }
      if (filters.amount_min) {
        filtered = filtered.filter((transaction) => transaction.amount >= filters.amount_min!);
      }
      if (filters.amount_max) {
        filtered = filtered.filter((transaction) => transaction.amount <= filters.amount_max!);
      }
    }

    return filtered.sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
  }

  static getTransactionSummary() {
    const transactions = UniversalTransactionService.getAllTransactions();
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisYear = new Date(today.getFullYear(), 0, 1);

    return {
      total_transactions: transactions.length,
      total_amount: transactions.reduce((sum, transaction) => sum + transaction.amount, 0),
      this_month: {
        count: transactions.filter((transaction) => new Date(transaction.date) >= thisMonth).length,
        amount: transactions
          .filter((transaction) => new Date(transaction.date) >= thisMonth)
          .reduce((sum, transaction) => sum + transaction.amount, 0),
      },
      this_year: {
        count: transactions.filter((transaction) => new Date(transaction.date) >= thisYear).length,
        amount: transactions
          .filter((transaction) => new Date(transaction.date) >= thisYear)
          .reduce((sum, transaction) => sum + transaction.amount, 0),
      },
      by_type: transactions.reduce((acc, transaction) => {
        acc[transaction.type] = (acc[transaction.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      by_payment_method: transactions.reduce((acc, transaction) => {
        acc[transaction.payment_method] = (acc[transaction.payment_method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

export default UniversalTransactionHandler;
