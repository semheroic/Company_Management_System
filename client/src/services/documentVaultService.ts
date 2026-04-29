import axios from "axios";
import {
  COMPANY_BASE_URL,
  requestWithCompanyFallback,
} from "./companyApi";

export interface DocumentVaultRecord {
  id: number;
  title: string;
  category: string;
  description: string;
  dateIssued: string;
  accessRole: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  uploadedBy: string;
  secured: boolean;
  type: string;
  uploadedAt: string;
  updatedAt: string;
}

export interface DocumentVaultSummary {
  totalDocuments: number;
  securedDocuments: number;
  categories: number;
}

export interface UploadDocumentInput {
  title: string;
  category: string;
  description?: string;
  dateIssued?: string;
  accessRole?: string;
  uploadedBy?: string;
  fileType?: string;
  file: File;
}

interface DocumentVaultApiRecord {
  id: number;
  title: string;
  category: string;
  description: string | null;
  date_issued: string | null;
  access_role: string;
  file_name: string;
  file_path: string;
  file_size: number | string;
  uploaded_by: string | null;
  secured: boolean;
  file_type: string | null;
  created_at: string;
  updated_at: string;
}

interface DocumentVaultResponse {
  records: DocumentVaultApiRecord[];
  summary: DocumentVaultSummary;
}

class DocumentVaultService {
  static async getAll(companyId?: string): Promise<{ records: DocumentVaultRecord[]; summary: DocumentVaultSummary }> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      const response = await axios.get<DocumentVaultResponse>(
        `${COMPANY_BASE_URL}/${targetId}/document-vault`,
        { headers: { "x-company-id": targetId } },
      );

      return {
        records: (response.data.records || []).map((record) => this.mapRecord(record)),
        summary: response.data.summary,
      };
    });
  }

  static async upload(input: UploadDocumentInput, companyId?: string): Promise<DocumentVaultRecord> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      const formData = new FormData();
      formData.append("title", input.title);
      formData.append("category", input.category);
      if (input.description) formData.append("description", input.description);
      if (input.dateIssued) formData.append("date_issued", input.dateIssued);
      if (input.accessRole) formData.append("access_role", input.accessRole);
      if (input.uploadedBy) formData.append("uploaded_by", input.uploadedBy);
      if (input.fileType) formData.append("file_type", input.fileType);
      formData.append("file", input.file);

      const response = await axios.post<DocumentVaultApiRecord>(
        `${COMPANY_BASE_URL}/${targetId}/document-vault`,
        formData,
        { headers: { "x-company-id": targetId } },
      );

      return this.mapRecord(response.data);
    });
  }

  static async remove(documentId: number, companyId?: string): Promise<void> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      await axios.delete(`${COMPANY_BASE_URL}/${targetId}/document-vault/${documentId}`, {
        headers: { "x-company-id": targetId },
      });
    });
  }

  private static mapRecord(record: DocumentVaultApiRecord): DocumentVaultRecord {
    return {
      id: Number(record.id),
      title: record.title,
      category: record.category,
      description: record.description || "",
      dateIssued: record.date_issued || "",
      accessRole: record.access_role,
      fileName: record.file_name,
      filePath: record.file_path,
      fileSize: Number(record.file_size || 0),
      uploadedBy: record.uploaded_by || "",
      secured: Boolean(record.secured),
      type: record.file_type || "Document",
      uploadedAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }
}

export default DocumentVaultService;
