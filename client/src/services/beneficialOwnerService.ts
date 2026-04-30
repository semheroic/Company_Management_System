import axios from "axios";
import { COMPANY_BASE_URL } from "./companyApi";

const BASE_URL = COMPANY_BASE_URL;

export interface BeneficialOwner {
  id: number; // Changed to number for MariaDB auto-increment
  company_id: number;
  full_name: string;
  nationality: string;
  id_number: string;
  date_of_birth?: string;
  relationship_to_company: 'direct_owner' | 'indirect_owner' | 'ultimate_controller' | 'nominee_beneficiary' | 'trustee' | 'other';
  ownership_percentage: number;
  control_percentage: number;
  has_significant_control: boolean;
  physical_address: string; // Matched your DB column name
  verification_status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  updated_at: string;
}

class BeneficialOwnerService {
  
  private static getHeaders(companyId: string | number) {
    return {
      headers: {
        "Content-Type": "application/json",
        "x-company-id": companyId.toString(),
      },
    };
  }

  static getCurrentCompanyId(): string {
    return localStorage.getItem('selectedCompanyId') || "";
  }

  // CREATE: Post to backend
  static async addBeneficialOwner(data: Partial<BeneficialOwner>) {
    const companyId = data.company_id || this.getCurrentCompanyId();
    const response = await axios.post(
      `${BASE_URL}/${companyId}/beneficial-owners`,
      data,
      this.getHeaders(companyId)
    );
    return response.data;
  }

  // READ: Get all for a company
  static async getAllBeneficialOwners(companyId?: string): Promise<BeneficialOwner[]> {
    const targetId = companyId || this.getCurrentCompanyId();
    if (!targetId) return [];
    const response = await axios.get(
      `${BASE_URL}/${targetId}/beneficial-owners`,
      this.getHeaders(targetId)
    );
    return (response.data || []).map((owner: any) => ({
      ...owner,
      id: Number(owner.id),
      company_id: Number(owner.company_id),
      ownership_percentage: Number(owner.ownership_percentage || 0),
      control_percentage: Number(owner.control_percentage || 0),
      has_significant_control: Boolean(owner.has_significant_control),
    }));
  }

  // UPDATE: Put to backend
  static async updateBeneficialOwner(id: number, updates: Partial<BeneficialOwner>) {
    const companyId = this.getCurrentCompanyId();
    const response = await axios.put(
      `${BASE_URL}/${companyId}/beneficial-owners/${id}`,
      updates,
      this.getHeaders(companyId)
    );
    return response.data;
  }

  // DELETE: Remove from MariaDB
  static async deleteBeneficialOwner(id: number | string): Promise<boolean> {
    const companyId = this.getCurrentCompanyId();
    const response = await axios.delete(
      `${BASE_URL}/${companyId}/beneficial-owners/${id}`,
      this.getHeaders(companyId)
    );
    return response.status === 200;
  }

  // VALIDATION: Now requested from backend for data integrity
 // REPLACE with this (computes locally from existing data):
  static async validateOwnership(companyId?: string): Promise<{
  isValid: boolean;
  totalPercentage: number;
  violations: string[];
}> {
  const owners = await this.getAllBeneficialOwners(companyId);
  const violations: string[] = [];

  const totalOwnership = owners.reduce((sum, o) => sum + o.ownership_percentage, 0);
  const totalControl = owners.reduce((sum, o) => sum + o.control_percentage, 0);

  if (totalOwnership > 100) {
    violations.push(`Total ownership is ${totalOwnership.toFixed(2)}% — exceeds 100%`);
  }
  if (totalControl > 100) {
    violations.push(`Total control is ${totalControl.toFixed(2)}% — exceeds 100%`);
  }
  if (owners.some(o => o.ownership_percentage < 0 || o.control_percentage < 0)) {
    violations.push("One or more owners have negative percentages");
  }

  return {
    isValid: violations.length === 0,
    totalPercentage: totalOwnership,
    violations,
  };
}

  static async validateOwnershipPercentages(companyId?: string) {
    return this.validateOwnership(companyId);
  }

  static getOwnershipMappings() {
    return [];
  }
}

export default BeneficialOwnerService;
