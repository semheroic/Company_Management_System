import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_API,
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
  tin?: string;
  status: 'active' | 'inactive' | 'pending';
  // ... other fields
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
}

export default CompanyService;