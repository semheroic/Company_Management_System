import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ActionLoadingState from '@/components/common/ActionLoadingState';
import ReportService, { type AuditTrailEvent } from '@/services/reportService';
import AuditFilters from './audit/AuditFilters';
import AuditLogTable from './audit/AuditLogTable';

const toDateRange = (days: string) => {
  const to = new Date();
  const from = new Date(Date.now() - parseInt(days, 10) * 24 * 60 * 60 * 1000);

  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
};

export default function AuditLogsPanel() {
  const { toast } = useToast();
  const [auditLogs, setAuditLogs] = useState<AuditTrailEvent[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditTrailEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('7');
  const [isLoading, setIsLoading] = useState(true);

  const applyFilters = () => {
    let filtered = [...auditLogs];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((log) =>
        log.description.toLowerCase().includes(query) ||
        log.user_name.toLowerCase().includes(query) ||
        log.table_name.toLowerCase().includes(query),
      );
    }

    if (actionFilter !== 'all') {
      filtered = filtered.filter((log) => log.action_type === actionFilter);
    }

    if (moduleFilter !== 'all') {
      filtered = filtered.filter((log) => log.table_name === moduleFilter);
    }

    setFilteredLogs(filtered);
  };

  useEffect(() => {
    const loadAuditLogs = async () => {
      setIsLoading(true);
      try {
        const range = toDateRange(dateFilter);
        const logs = await ReportService.getAuditTrailEvents(range);
        setAuditLogs(logs);
      } catch (error) {
        console.error('Failed to load audit trail events:', error);
        setAuditLogs([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadAuditLogs();
  }, [dateFilter]);

  useEffect(() => {
    applyFilters();
  }, [actionFilter, auditLogs, moduleFilter, searchQuery]);

  const exportAuditLog = () => {
    const csvContent = [
      'Date,User,Action,Module,Description,Record ID',
      ...filteredLogs.map((log) =>
        [
          new Date(log.changed_at).toLocaleString(),
          log.user_name,
          log.action_type,
          log.table_name,
          log.description,
          log.record_id,
        ]
          .map((field) => `"${String(field).replace(/"/g, '""')}"`)
          .join(','),
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Audit Log Exported',
      description: 'Audit log has been downloaded as CSV file',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Audit Trail
          </CardTitle>
          <Button variant="outline" onClick={exportAuditLog} className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Export Log
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <AuditFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            actionFilter={actionFilter}
            setActionFilter={setActionFilter}
            moduleFilter={moduleFilter}
            setModuleFilter={setModuleFilter}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            onApplyFilters={applyFilters}
          />

          {isLoading ? (
            <ActionLoadingState
              title="Loading audit trail"
              description="Combining journals, payroll, tax filings, invoices, and audit reports from the backend."
            />
          ) : (
            <AuditLogTable logs={filteredLogs} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
