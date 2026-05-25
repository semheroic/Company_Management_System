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
import { Loader2, ShieldCheck, Wallet, Workflow } from "lucide-react";

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
  { value: "sales", label: "Core sales revenue" },
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
      <DialogContent className="max-h-[94vh] max-w-5xl overflow-hidden border-0 p-0 shadow-2xl">
        <div className="grid max-h-[94vh] lg:grid-cols-[0.95fr_1.45fr]">
          <aside className="hidden bg-[radial-gradient(circle_at_top,#eff6ff_0%,#dbeafe_40%,#0f172a_130%)] p-8 text-slate-900 lg:flex lg:flex-col">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/85 shadow-sm">
                <Workflow className="h-6 w-6 text-sky-700" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">Unified workflow</p>
                <h3 className="text-2xl font-semibold">Post once, update everywhere</h3>
              </div>
            </div>

            <p className="text-sm leading-6 text-slate-700">
              This entry creates the accounting journal first, then refreshes the connected registers and dashboard metrics for the active company workspace.
            </p>

            <div className="mt-8 grid gap-4">
              <div className="rounded-2xl border border-white/60 bg-white/75 p-4 backdrop-blur">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <ShieldCheck className="h-4 w-4 text-sky-700" />
                  Control checks
                </div>
                <p className="text-sm text-slate-600">
                  The form validates balancing rules, company context, and related register updates before confirming success.
                </p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/75 p-4 backdrop-blur">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Wallet className="h-4 w-4 text-sky-700" />
                  Live accounting preview
                </div>
                <p className="text-sm text-slate-600">
                  Configure payment, credit handling, and classification once so the ledger reflects the real transaction flow.
                </p>
              </div>
            </div>

            <div className="mt-auto rounded-3xl border border-slate-200/70 bg-slate-950 p-5 text-slate-100">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">Current setup</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge className="border-none bg-white/10 text-slate-100">Backend ledger sync</Badge>
                <Badge className="border-none bg-white/10 text-slate-100">Register updates</Badge>
                <Badge className="border-none bg-white/10 text-slate-100">Company aware</Badge>
              </div>
            </div>
          </aside>

          <div className="max-h-[94vh] overflow-y-auto bg-white">
            <DialogHeader className="border-b border-slate-200 px-6 py-5 sm:px-8">
              <DialogTitle className="text-2xl font-semibold text-slate-950">Quick Transaction Entry</DialogTitle>
              <p className="mt-2 text-sm text-slate-600">
                Create a transaction that posts to the accounting books and keeps the connected reporting views aligned.
              </p>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6 sm:px-8">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Transaction basics</h3>
                    <p className="mt-1 text-sm text-slate-600">Define the business event, amount, and posting date.</p>
                  </div>
                  <Badge variant="outline" className="w-fit border-sky-200 bg-sky-50 text-sky-700">
                    Active company context required
                  </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="type">Transaction Type</Label>
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

                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (RWF)</Label>
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

                  <div className="space-y-2">
                    <Label htmlFor="payment_method">
                      Payment Method
                      {!requiresPaymentMethod && <span className="ml-1 text-slate-400">(Optional)</span>}
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

                  <div className="space-y-2">
                    <Label htmlFor="date">Transaction Date</Label>
                    <Input id="date" type="date" value={formData.date} onChange={(event) => updateField("date", event.target.value)} />
                  </div>
                </div>
              </div>

              {showInvoiceFields && (
                <div className="rounded-2xl border border-violet-200 bg-violet-50/80 p-5">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-700">Credit handling</h3>
                    <p className="mt-1 text-sm text-violet-900/80">
                      Configure whether the transaction is paid immediately, unpaid, or partially settled.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="payment_status">Payment Status</Label>
                      <Select value={formData.payment_status} onValueChange={(value) => updateField("payment_status", value)}>
                        <SelectTrigger id="payment_status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="unpaid">Unpaid</SelectItem>
                          <SelectItem value="partially_paid">Partially paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.payment_status === "partially_paid" && (
                      <div className="space-y-2">
                        <Label htmlFor="paid_amount">Amount Paid</Label>
                        <Input
                          id="paid_amount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.paid_amount}
                          onChange={(event) => updateField("paid_amount", event.target.value)}
                          placeholder="Amount already paid"
                        />
                      </div>
                    )}

                    {formData.payment_status !== "paid" && (
                      <div className="space-y-2">
                        <Label htmlFor="due_date">Due Date</Label>
                        <Input id="due_date" type="date" value={formData.due_date} onChange={(event) => updateField("due_date", event.target.value)} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isCapitalTransaction && (
                <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-5">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">Capital and equity details</h3>
                    <p className="mt-1 text-sm text-sky-900/80">
                      Capture shareholder allocation and equity metadata so related capital analytics stay aligned.
                    </p>
                  </div>

                  {showShareholderFields && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="shareholder_name">Shareholder Name</Label>
                        <Input
                          id="shareholder_name"
                          value={formData.shareholder_name}
                          onChange={(event) => updateField("shareholder_name", event.target.value)}
                          placeholder="Enter shareholder name"
                        />
                      </div>
                      <div className="space-y-2">
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
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="par_value">Par Value per Share</Label>
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
                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
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
                      <div className="space-y-2">
                        <Label htmlFor="from_account">From Account</Label>
                        <Input
                          id="from_account"
                          value={formData.from_account}
                          onChange={(event) => updateField("from_account", event.target.value)}
                          placeholder="Retained Earnings"
                        />
                      </div>
                      <div className="space-y-2">
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
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Transfer routing</h3>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="from_account">From Account</Label>
                      <Input
                        id="from_account"
                        value={formData.from_account}
                        onChange={(event) => updateField("from_account", event.target.value)}
                        placeholder="Cash on Hand"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="to_account">To Account</Label>
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
                <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">Tax classification</h3>
                    <p className="mt-1 text-sm text-amber-900/80">
                      This category feeds corporate income tax and compliance reports.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tax_category">Tax Category</Label>
                    <Select value={formData.tax_category} onValueChange={(value) => updateField("tax_category", value)}>
                      <SelectTrigger id="tax_category">
                        <SelectValue placeholder="Select tax category" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {TaxCategoryService.getAllCategories().map((category) => (
                          <SelectItem key={category.code} value={category.code}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedTaxCategory && (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-white p-4 text-sm text-slate-700">
                      <div className="font-medium text-slate-900">{selectedTaxCategory.label}</div>
                      <div className="mt-1 text-slate-500">{selectedTaxCategory.label_rw}</div>
                      {selectedTaxCategory.description && <p className="mt-2 text-slate-600">{selectedTaxCategory.description}</p>}
                      <Badge className="mt-3 border-none bg-slate-900 text-white">
                        {selectedTaxCategory.deductible ? "Tax deductible" : "Not tax deductible"}
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {showIncomeSourceField && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Income classification</h3>
                    <p className="mt-1 text-sm text-emerald-900/80">Choose the source that best reflects why the funds were received.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="income_source">Income Source</Label>
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
                <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">Mobile money details</h3>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone_number">Phone Number</Label>
                      <Input
                        id="phone_number"
                        value={formData.phone_number}
                        onChange={(event) => updateField("phone_number", event.target.value)}
                        placeholder="078xxxxxxx"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="momo_reference">Transaction Reference</Label>
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
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Invoice metadata</h3>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="invoice_number">Invoice / Receipt Number</Label>
                      <Input
                        id="invoice_number"
                        value={formData.invoice_number}
                        onChange={(event) => updateField("invoice_number", event.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tin">TIN Number</Label>
                      <Input id="tin" value={formData.tin} onChange={(event) => updateField("tin", event.target.value)} placeholder="Tax identification number" />
                    </div>
                  </div>
                </div>
              )}

              {formData.type === "sale" && (
                <div className="space-y-2">
                  <Label htmlFor="client">Client Name</Label>
                  <Input id="client" value={formData.client} onChange={(event) => updateField("client", event.target.value)} placeholder="Enter client name" />
                </div>
              )}

              {formData.type === "purchase" && (
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier Name</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(event) => updateField("supplier", event.target.value)}
                    placeholder="Enter supplier name"
                  />
                </div>
              )}

              {!showInvoiceFields && !showShareholderFields && !showTransferFields && (
                <div className="space-y-2">
                  <Label htmlFor="party_name">Counterparty</Label>
                  <Input
                    id="party_name"
                    value={formData.party_name}
                    onChange={(event) => updateField("party_name", event.target.value)}
                    placeholder="Optional party or payee name"
                  />
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="reference">Reference Number</Label>
                  <Input id="reference" value={formData.reference} onChange={(event) => updateField("reference", event.target.value)} placeholder="Optional reference" />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Journal preview</p>
                  <div className="mt-3 space-y-1 text-sm font-mono text-slate-700">
                    {formData.amount && formData.type ? (
                      <>
                        <div className="flex justify-between gap-4">
                          <span>Estimated amount</span>
                          <span>RWF {Number(formData.amount || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Entry class</span>
                          <span>{transactionTypeOptions.find((option) => option.value === formData.type)?.label || formData.type}</span>
                        </div>
                        {formData.payment_status !== "paid" && (
                          <div className="flex justify-between gap-4">
                            <span>Settlement status</span>
                            <span>{formData.payment_status.replace("_", " ")}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="font-sans text-sm text-slate-500">Select a transaction type and amount to preview the posting context.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  placeholder="Summarize the transaction purpose"
                  className="min-h-28"
                />
              </div>

              <div className="sticky bottom-0 flex flex-col gap-3 border-t border-slate-200 bg-white/95 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-end">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-slate-950 text-white hover:bg-slate-800">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting transaction
                    </>
                  ) : (
                    "Post Transaction"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
