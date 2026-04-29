import axios from "axios";
import {
  COMPANY_BASE_URL,
  requestWithCompanyFallback,
} from "./companyApi";

export interface CompanySettings {
  general: {
    companyName: string;
    companyEmail: string;
    timeZone: string;
    currency: string;
    language: string;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    deadlineAlerts: boolean;
    systemUpdates: boolean;
    reportReady: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: string;
    passwordPolicy: string;
    auditLogging: boolean;
  };
  integrations: {
    emailServiceConfigured: boolean;
    backupConfigured: boolean;
  };
}

class SettingsService {
  static async get(companyId?: string): Promise<CompanySettings> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      const response = await axios.get<CompanySettings>(
        `${COMPANY_BASE_URL}/${targetId}/settings`,
        { headers: { "x-company-id": targetId } },
      );

      return response.data;
    });
  }

  static async save(settings: CompanySettings, companyId?: string): Promise<CompanySettings> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      const response = await axios.put<CompanySettings>(
        `${COMPANY_BASE_URL}/${targetId}/settings`,
        settings,
        {
          headers: {
            "Content-Type": "application/json",
            "x-company-id": targetId,
          },
        },
      );

      return response.data;
    });
  }
}

export default SettingsService;
