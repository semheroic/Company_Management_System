
import { useState } from "react";
import { Download, FileText, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

interface ExportButtonProps {
  data: any[];
  filename: string;
  title?: string;
  columns?: { key: string; label: string }[];
}

export function ExportButton({ data, filename, title, columns }: ExportButtonProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const exportToExcel = () => {
    try {
      setIsExporting(true);
      
      // Process data for export
      const exportData = data.map(item => {
        if (columns) {
          const row: any = {};
          columns.forEach(col => {
            row[col.label] = item[col.key] || '';
          });
          return row;
        }
        return item;
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      
      XLSX.writeFile(wb, `${filename}.xlsx`);
      
      toast({
        title: "Export Successful",
        description: `Data exported to ${filename}.xlsx`
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export to Excel",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = () => {
    try {
      setIsExporting(true);
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      
      // Header
      doc.setFontSize(16);
      doc.text(title || filename, pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 30, { align: 'center' });
      
      // Table data
      let yPosition = 50;
      const lineHeight = 6;
      
      if (columns && data.length > 0) {
        // Headers
        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        let xPosition = 20;
        columns.forEach(col => {
          doc.text(col.label, xPosition, yPosition);
          xPosition += 40;
        });
        
        yPosition += lineHeight;
        doc.setFont(undefined, 'normal');
        
        // Data rows
        data.slice(0, 30).forEach(item => { // Limit to first 30 rows
          xPosition = 20;
          columns.forEach(col => {
            const value = String(item[col.key] || '');
            doc.text(value.substring(0, 15), xPosition, yPosition);  // Truncate long values
            xPosition += 40;
          });
          yPosition += lineHeight;
          
          if (yPosition > 280) { // New page if needed
            doc.addPage();
            yPosition = 20;
          }
        });
      }
      
      doc.save(`${filename}.pdf`);
      
      toast({
        title: "Export Successful",
        description: `Data exported to ${filename}.pdf`
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export to PDF",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? "Exporting..." : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToExcel}>
          <File className="w-4 h-4 mr-2" />
          Export to Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="w-4 h-4 mr-2" />
          Export to PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
