import axios from "axios";
import { API_BASE_URL } from "@/lib/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Automatically inject the selected Company ID into every request header
api.interceptors.request.use((config) => {
  const id = localStorage.getItem('selectedCompanyId');
  if (id) config.headers['x-company-id'] = id;
  return config;
});

export interface Company {
  id: number;
  name: string;
  logo_url?: string | null;
  registration_number?: string | null;
  tin?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  sector?: string | null;
  size?: string | null;
  currency?: string;
  incorporation_date?: string | null;
  fiscal_year_start?: string | null;
  tax_regime?: string | null;
  country?: string | null;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  created_at?: string;
  updated_at?: string;
}

class CompanyService {
  /** * Local Management 
   */
  static setSelectedId(id: number) {
    localStorage.setItem('selectedCompanyId', id.toString());
    window.dispatchEvent(new CustomEvent('companyChanged', { detail: { id } }));
  }

  static getSelectedId(): number | null {
    const id = localStorage.getItem('selectedCompanyId');
    return id ? parseInt(id) : null;
  }

  /** * API Calls 
   */
  
  // Fetches the company currently set in the header
  static async getCurrentCompany(): Promise<Company | null> {
    const id = this.getSelectedId();
    if (!id) return null;
    try {
      const { data } = await api.get(`/company/${id}`);
      return data;
    } catch (err) {
      // Handle 403 (Inactive) or 404 here
      return null;
    }
  }

  // Gets all companies (useful for a "Switch Company" dropdown)
  static async getAllCompanies(): Promise<Company[]> {
    try {
      const { data } = await api.get('/companies');
      return data;
    } catch (err) { return []; }
  }

  static async createCompany(formData: Partial<Company>): Promise<Company | null> {
    try {
      const { data } = await api.post('/company', formData);
      return data;
    } catch (err) { return null; }
  }

  static async updateCompany(id: number, updates: Partial<Company>): Promise<Company | null> {
    try {
      const { data } = await api.put(`/company/${id}`, updates);
      return data;
    } catch (err) { return null; }
  }

  static async deleteCompany(id: number): Promise<boolean> {
    try {
      await api.delete(`/company/${id}`);
      return true;
    } catch (err) {
      return false;
    }
  }
}

export default CompanyService;
