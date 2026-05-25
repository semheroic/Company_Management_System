import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import UniversalTransactionHandler from "@/services/universalTransactionHandler";
import type { TransactionRequest } from "@/services/universalTransactionHandler";
import TaxCategoryService from "@/services/taxCategoryService";
import { Loader2 } from "lucide-react";

interface UniversalTransactionFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const initialFormState = {
  type: "",
  amount: "",
  payment_method: "",
  payment_status: "paid",
  paid_amount: "",
  due_date: "",
  party_name: "",
  description: "",
  date: new Date().toISOString().split("T")[0],
  reference: "",
  supplier: "",
  client: "",
  income_source: "",
  tax_category: "",
  invoice_number: "",
  tin: "",
  phone_number: "",
  momo_reference: "",
  shareholder_name: "",
  shareholder_id: "",
  shares_allocated: "",
  par_value: "1000",
  adjustment_type: "",
  from_account: "",
  to_account: "",
};

const transactionTypeOptions = [
  { value: "sale", label: "Sale / Revenue" },
  { value: "income", label: "Other Income" },
  { value: "purchase", label: "Purchase" },
  { value: "expense", label: "General Expense" },
  { value: "salary", label: "Salary Payment" },
  { value: "asset_acquisition", label: "Asset Purchase" },
  { value: "transfer", label: "Account Transfer" },
  { value: "capital_contribution", label: "Capital Contribution" },
  { value: "capital_withdrawal", label: "Capital Withdrawal" },
  { value: "share_issuance", label: "Share Issuance" },
  { value: "dividend_declaration", label: "Dividend Declaration" },
  { value: "dividend_payment", label: "Dividend Payment" },
  { value: "equity_adjustment", label: "Equity Adjustment" },
];

const paymentMethodOptions = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank Transfer" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "card", label: "Card" },
  { value: "cheque", label: "Cheque" },
];

const incomeSourceOptions = [
  { value: "sales", label: "Sales revenue" },
  { value: "loan_creditor", label: "Loan or creditor funds" },
  { value: "gift_friend", label: "Gift or contribution" },
  { value: "grant_donation", label: "Grant or donation" },
  { value: "asset_sale", label: "Asset sale" },
  { value: "investment_return", label: "Investment return" },
  { value: "other", label: "Other income" },
];

export function UniversalTransactionForm({ open, onClose, onSuccess }: UniversalTransactionFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCapitalTransaction = [
    "capital_contribution",
    "capital_withdrawal",
    "share_issuance",
    "dividend_declaration",
    "dividend_payment",
    "equity_adjustment",
  ].includes(formData.type);
  const showInvoiceFields = formData.type === "sale" || formData.type === "purchase";
  const showMobileMoneyFields = formData.payment_method === "mobile_money";
  const showIncomeSourceField = formData.type === "sale" || formData.type === "income";
  const showTaxCategoryField = formData.type === "expense" || formData.type === "purchase";
  const showShareholderFields = ["capital_contribution", "capital_withdrawal", "share_issuance", "dividend_payment"].includes(formData.type);
  const showEquityAdjustmentFields = formData.type === "equity_adjustment";
  const showTransferFields = formData.type === "transfer";
  const requiresPaymentMethod = !["dividend_declaration", "equity_adjustment", "transfer"].includes(formData.type);
  const selectedTaxCategory = TaxCategoryService.getCategory(formData.tax_category);

  const updateField = (key: keyof typeof initialFormState, value: string) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setFormData(initialFormState);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.type || !formData.amount || !formData.description) {
      toast({
        title: "Validation Error",
        description: "Transaction type, amount, and description are required.",
        variant: "destructive",
      });
      return;
    }

    if (requiresPaymentMethod && !formData.payment_method) {
      toast({
        title: "Validation Error",
        description: "Select a payment method for this transaction.",
        variant: "destructive",
      });
      return;
    }

    if (showShareholderFields && !formData.shareholder_name) {
      toast({
        title: "Validation Error",
        description: "Shareholder name is required for capital transactions.",
        variant: "destructive",
      });
      return;
    }

    if (showIncomeSourceField && !formData.income_source) {
      toast({
        title: "Validation Error",
        description: "Select an income source for reporting.",
        variant: "destructive",
      });
      return;
    }

    if (showTaxCategoryField && !formData.tax_category) {
      toast({
        title: "Validation Error",
        description: "Select a tax category for this expense or purchase.",
        variant: "destructive",
      });
      return;
    }

    if (showMobileMoneyFields && (!formData.phone_number || !formData.momo_reference)) {
      toast({
        title: "Validation Error",
        description: "Phone number and mobile money reference are required.",
        variant: "destructive",
      });
      return;
    }

    if (formData.type === "sale" && !formData.client.trim()) {
      toast({
        title: "Validation Error",
        description: "Client name is required for sales transactions.",
        variant: "destructive",
      });
      return;
    }

    if (formData.type === "purchase" && !formData.supplier.trim()) {
      toast({
        title: "Validation Error",
        description: "Supplier name is required for purchases.",
        variant: "destructive",
      });
      return;
    }

    if (showTransferFields && (!formData.from_account.trim() || !formData.to_account.trim())) {
      toast({
        title: "Validation Error",
        description: "From account and to account are required for transfers.",
        variant: "destructive",
      });
      return;
    }

    if ((formData.payment_status === "unpaid" || formData.payment_status === "partially_paid") && !formData.due_date) {
      toast({
        title: "Validation Error",
        description: "A due date is required for credit transactions.",
        variant: "destructive",
      });
      return;
    }

    const amount = Number(formData.amount);
    const paidAmount = Number(formData.paid_amount || 0);
    if (formData.payment_status === "partially_paid" && (paidAmount <= 0 || paidAmount >= amount)) {
      toast({
        title: "Validation Error",
        description: "Partially paid transactions need a paid amount that is greater than 0 and less than the total.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const partyName =
        formData.type === "sale"
          ? formData.client
          : formData.type === "purchase"
            ? formData.supplier
            : formData.type === "capital_contribution" || formData.type === "capital_withdrawal" || formData.type === "share_issuance"
              ? formData.shareholder_name
              : formData.party_name;

      const response = await UniversalTransactionHandler.processTransaction({
        type: formData.type as TransactionRequest["type"],
        amount,
        description: formData.description,
        date: formData.date,
        payment_method: (formData.payment_method || "bank") as TransactionRequest["payment_method"],
        payment_status: formData.payment_status as TransactionRequest["payment_status"],
        paid_amount:
          formData.payment_status === "partially_paid"
            ? paidAmount
            : formData.payment_status === "paid"
              ? amount
              : 0,
        due_date: formData.payment_status !== "paid" ? formData.due_date : undefined,
        party_name: partyName || undefined,
        reference_number: formData.reference || undefined,
        supporting_documents: [],
        additional_data: {
          supplier: formData.supplier || undefined,
          client: formData.client || undefined,
          income_source: formData.income_source || undefined,
          tax_category: formData.tax_category || undefined,
          invoice_number: formData.invoice_number || undefined,
          tin: formData.tin || undefined,
          phone_number: formData.phone_number || undefined,
          momo_reference: formData.momo_reference || undefined,
          shareholder_name: formData.shareholder_name || undefined,
          shareholder_id: formData.shareholder_id || `SH-${Date.now()}`,
          shares_allocated: Number(formData.shares_allocated || 0),
          par_value: Number(formData.par_value || 1000),
          adjustment_type: formData.adjustment_type || undefined,
          from_account: formData.from_account || undefined,
          to_account: formData.to_account || undefined,
        },
      });

      if (!response.success) {
        toast({
          title: "Transaction Failed",
          description: response.errors?.join(", ") || "Failed to process transaction.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Transaction Posted",
        description:
          response.warnings && response.warnings.length > 0
            ? `${response.accounting_entries.length} journal lines were posted. ${response.warnings.join(" ")}`
            : `${response.accounting_entries.length} journal lines were posted successfully.`,
      });

      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to post transaction.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Universal Transaction Entry</DialogTitle>
          <p className="text-sm text-gray-600">
            Single entry system that posts to the accounting books and updates the related registers.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="type">Transaction Type *</Label>
              <Select value={formData.type} onValueChange={(value) => updateField("type", value)}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select transaction type" />
                </SelectTrigger>
                <SelectContent>
                  {transactionTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount">Amount (RWF) *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(event) => updateField("amount", event.target.value)}
                placeholder="Enter amount"
              />
            </div>

            <div>
              <Label htmlFor="payment_method">
                Payment Method
                {!requiresPaymentMethod && <span className="ml-1 text-gray-400">(Optional)</span>}
              </Label>
              <Select value={formData.payment_method} onValueChange={(value) => updateField("payment_method", value)}>
                <SelectTrigger id="payment_method">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date">Date *</Label>
              <Input id="date" type="date" value={formData.date} onChange={(event) => updateField("date", event.target.value)} />
            </div>
          </div>

          {showInvoiceFields && (
            <div className="space-y-4 rounded-lg border border-purple-200 bg-purple-50 p-4">
              <div>
                <h3 className="font-medium text-purple-900">Payment Status & Credit Handling</h3>
                <p className="mt-1 text-sm text-purple-700">
                  Configure whether the transaction is paid immediately, unpaid, or partially settled.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="payment_status">Payment Status *</Label>
                  <Select value={formData.payment_status} onValueChange={(value) => updateField("payment_status", value)}>
                    <SelectTrigger id="payment_status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="partially_paid">Partially Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.payment_status === "partially_paid" && (
                  <div>
                    <Label htmlFor="paid_amount">Amount Paid (RWF)</Label>
                    <Input
                      id="paid_amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.paid_amount}
                      onChange={(event) => updateField("paid_amount", event.target.value)}
                      placeholder="Amount already paid"
                    />
                    <p className="mt-1 text-xs text-purple-700">
                      Remaining: RWF {(Number(formData.amount || 0) - Number(formData.paid_amount || 0)).toLocaleString()}
                    </p>
                  </div>
                )}

                {formData.payment_status !== "paid" && (
                  <div>
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input id="due_date" type="date" value={formData.due_date} onChange={(event) => updateField("due_date", event.target.value)} />
                  </div>
                )}
              </div>

              {formData.payment_status !== "paid" && formData.amount && (
                <div className="rounded border border-purple-200 bg-purple-100 p-3 text-xs text-purple-900">
                  Credit transactions will post the unpaid balance to receivables or payables until settlement.
                </div>
              )}
            </div>
          )}

          {isCapitalTransaction && (
            <div className="space-y-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div>
                <h3 className="font-medium text-blue-900">Capital & Equity Details</h3>
                <p className="mt-1 text-sm text-blue-700">
                  Capture the shareholder or equity metadata that belongs with this journal entry.
                </p>
              </div>

              {showShareholderFields && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="shareholder_name">Shareholder Name *</Label>
                    <Input
                      id="shareholder_name"
                      value={formData.shareholder_name}
                      onChange={(event) => updateField("shareholder_name", event.target.value)}
                      placeholder="Enter shareholder name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shares_allocated">Shares Allocated</Label>
                    <Input
                      id="shares_allocated"
                      type="number"
                      min="0"
                      value={formData.shares_allocated}
                      onChange={(event) => updateField("shares_allocated", event.target.value)}
                      placeholder="Number of shares"
                    />
                  </div>
                </div>
              )}

              {formData.type === "share_issuance" && (
                <div>
                  <Label htmlFor="par_value">Par Value per Share (RWF)</Label>
                  <Input
                    id="par_value"
                    type="number"
                    min="0"
                    value={formData.par_value}
                    onChange={(event) => updateField("par_value", event.target.value)}
                    placeholder="1000"
                  />
                </div>
              )}

              {showEquityAdjustmentFields && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="adjustment_type">Adjustment Type</Label>
                    <Select value={formData.adjustment_type} onValueChange={(value) => updateField("adjustment_type", value)}>
                      <SelectTrigger id="adjustment_type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="correction">Correction</SelectItem>
                        <SelectItem value="revaluation">Revaluation</SelectItem>
                        <SelectItem value="reclassification">Reclassification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="from_account">From Account</Label>
                    <Input
                      id="from_account"
                      value={formData.from_account}
                      onChange={(event) => updateField("from_account", event.target.value)}
                      placeholder="Retained Earnings"
                    />
                  </div>
                  <div>
                    <Label htmlFor="to_account">To Account</Label>
                    <Input
                      id="to_account"
                      value={formData.to_account}
                      onChange={(event) => updateField("to_account", event.target.value)}
                      placeholder="Equity Adjustment"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {showTransferFields && (
            <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div>
                <h3 className="font-medium text-slate-900">Transfer Routing</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Define the two accounts involved in the transfer.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="from_account">From Account *</Label>
                  <Input
                    id="from_account"
                    value={formData.from_account}
                    onChange={(event) => updateField("from_account", event.target.value)}
                    placeholder="Cash on Hand"
                  />
                </div>
                <div>
                  <Label htmlFor="to_account">To Account *</Label>
                  <Input
                    id="to_account"
                    value={formData.to_account}
                    onChange={(event) => updateField("to_account", event.target.value)}
                    placeholder="Cash at Bank"
                  />
                </div>
              </div>
            </div>
          )}

          {showTaxCategoryField && (
            <div className="space-y-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
              <div>
                <h3 className="font-medium text-orange-900">Tax Classification</h3>
                <p className="mt-1 text-sm text-orange-700">
                  This category feeds corporate income tax and compliance reporting.
                </p>
              </div>

              <div>
                <Label htmlFor="tax_category">Tax Category *</Label>
                <Select value={formData.tax_category} onValueChange={(value) => updateField("tax_category", value)}>
                  <SelectTrigger id="tax_category">
                    <SelectValue placeholder="Select tax classification" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {TaxCategoryService.getAllCategories().map((category) => (
                      <SelectItem key={category.code} value={category.code}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedTaxCategory && (
                  <div className="mt-3 rounded border border-orange-200 bg-white p-3">
                    <div className="font-medium text-slate-900">{selectedTaxCategory.label}</div>
                    <div className="mt-1 text-xs text-gray-600">{selectedTaxCategory.label_rw}</div>
                    {selectedTaxCategory.description && (
                      <p className="mt-2 text-xs text-gray-600">{selectedTaxCategory.description}</p>
                    )}
                    <Badge
                      variant={selectedTaxCategory.deductible ? "default" : "destructive"}
                      className="mt-2 text-xs"
                    >
                      {selectedTaxCategory.deductible ? "Tax Deductible" : "Not Tax Deductible"}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {showIncomeSourceField && (
            <div className="space-y-4 rounded-lg border border-green-200 bg-green-50 p-4">
              <div>
                <h3 className="font-medium text-green-900">Income Source Classification</h3>
                <p className="mt-1 text-sm text-green-700">
                  Choose the source that best explains why the funds were received.
                </p>
              </div>

              <div>
                <Label htmlFor="income_source">Source of Income *</Label>
                <Select value={formData.income_source} onValueChange={(value) => updateField("income_source", value)}>
                  <SelectTrigger id="income_source">
                    <SelectValue placeholder="Select income source" />
                  </SelectTrigger>
                  <SelectContent>
                    {incomeSourceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {showMobileMoneyFields && (
            <div className="space-y-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div>
                <h3 className="font-medium text-blue-900">Mobile Money Details</h3>
                <p className="mt-1 text-sm text-blue-700">
                  Capture the phone number and reference used by the wallet transaction.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="phone_number">Phone Number *</Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={(event) => updateField("phone_number", event.target.value)}
                    placeholder="078xxxxxxx"
                  />
                </div>

                <div>
                  <Label htmlFor="momo_reference">Transaction Reference *</Label>
                  <Input
                    id="momo_reference"
                    value={formData.momo_reference}
                    onChange={(event) => updateField("momo_reference", event.target.value)}
                    placeholder="MM-123456"
                  />
                </div>
              </div>
            </div>
          )}

          {showInvoiceFields && (
            <div className="space-y-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="font-medium text-blue-900">Invoice / Receipt Details</h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="invoice_number">Invoice / Receipt Number</Label>
                  <Input
                    id="invoice_number"
                    value={formData.invoice_number}
                    onChange={(event) => updateField("invoice_number", event.target.value)}
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <Label htmlFor="tin">TIN Number</Label>
                  <Input
                    id="tin"
                    value={formData.tin}
                    onChange={(event) => updateField("tin", event.target.value)}
                    placeholder="Tax identification number"
                  />
                </div>
              </div>
            </div>
          )}

          {formData.type === "sale" && (
            <div>
              <Label htmlFor="client">Client Name *</Label>
              <Input
                id="client"
                value={formData.client}
                onChange={(event) => updateField("client", event.target.value)}
                placeholder="Enter client name"
              />
            </div>
          )}

          {formData.type === "purchase" && (
            <div>
              <Label htmlFor="supplier">Supplier Name *</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(event) => updateField("supplier", event.target.value)}
                placeholder="Enter supplier name"
              />
            </div>
          )}

          {!showInvoiceFields && !showShareholderFields && !showTransferFields && (
            <div>
              <Label htmlFor="party_name">Counterparty</Label>
              <Input
                id="party_name"
                value={formData.party_name}
                onChange={(event) => updateField("party_name", event.target.value)}
                placeholder="Optional party or payee name"
              />
            </div>
          )}

          <div>
            <Label htmlFor="reference">Reference Number</Label>
            <Input
              id="reference"
              value={formData.reference}
              onChange={(event) => updateField("reference", event.target.value)}
              placeholder="Optional reference"
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="Enter transaction description"
            />
          </div>

          {formData.amount && formData.type && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <h4 className="mb-2 font-medium text-green-900">Accounting Journal Preview</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Entry type</span>
                  <span className="font-medium text-slate-900">
                    {transactionTypeOptions.find((option) => option.value === formData.type)?.label || formData.type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Amount</span>
                  <span className="font-medium text-slate-900">RWF {Number(formData.amount || 0).toLocaleString()}</span>
                </div>
                {formData.payment_status !== "paid" && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Settlement status</span>
                    <span className="font-medium capitalize text-slate-900">
                      {formData.payment_status.replace("_", " ")}
                    </span>
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-green-700">
                This entry updates the accounting books first, then refreshes the related company registers.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : (
                "Process Transaction"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
