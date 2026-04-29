import axios from "axios";
import {
  COMPANY_BASE_URL,
  getCompanyHeaders,
  requestWithCompanyFallback,
} from "./companyApi";

export interface FixedAsset {
  id: number;
  name: string;
  category: string;
  acquisitionDate: string;
  acquisitionCost: number;
  depreciationMethod: "straight_line" | "reducing_balance";
  usefulLifeYears: number;
  residualValue: number;
  currentBookValue: number;
  location: string;
  supplier?: string | null;
  status: "active" | "retired" | "disposed";
  retirementDate?: string | null;
  disposalAmount?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFixedAssetInput {
  name: string;
  category: string;
  acquisitionDate: string;
  acquisitionCost: number;
  depreciationMethod: "straight_line" | "reducing_balance";
  usefulLifeYears: number;
  residualValue: number;
  location: string;
  supplier?: string;
  status: "active" | "retired" | "disposed";
}

export interface AssetSummary {
  totalAssets: number;
  totalOriginalCost: number;
  totalCurrentValue: number;
  totalDepreciation: number;
  activeAssets: number;
  retiredAssets: number;
}

interface FixedAssetApiRecord {
  id: number;
  name: string;
  category: string;
  acquisition_date: string;
  acquisition_cost: number | string;
  depreciation_method: "straight_line" | "reducing_balance";
  useful_life_years: number | string;
  residual_value: number | string;
  location: string | null;
  supplier: string | null;
  status: "active" | "retired" | "disposed";
  retirement_date: string | null;
  disposal_amount: number | string | null;
  created_at: string;
  updated_at: string;
}

interface FixedAssetResponse {
  records: FixedAssetApiRecord[];
}

class FixedAssetService {
  static async getAllAssets(companyId?: string): Promise<FixedAsset[]> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      const response = await axios.get<FixedAssetResponse>(
        `${COMPANY_BASE_URL}/${targetId}/fixed-assets`,
        getCompanyHeaders(targetId),
      );

      return (response.data.records || []).map((record) => this.mapAsset(record));
    });
  }

  static async addAsset(assetData: CreateFixedAssetInput, companyId?: string): Promise<FixedAsset> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      const response = await axios.post<FixedAssetApiRecord>(
        `${COMPANY_BASE_URL}/${targetId}/fixed-assets`,
        {
          name: assetData.name,
          category: assetData.category,
          acquisition_date: assetData.acquisitionDate,
          acquisition_cost: assetData.acquisitionCost,
          depreciation_method: assetData.depreciationMethod,
          useful_life_years: assetData.usefulLifeYears,
          residual_value: assetData.residualValue,
          location: assetData.location || null,
          supplier: assetData.supplier || null,
          status: assetData.status,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-company-id": targetId,
          },
        },
      );

      return this.mapAsset(response.data);
    });
  }

  static async retireAsset(
    id: number,
    retirementDate: string,
    disposalAmount?: number,
    companyId?: string,
  ): Promise<FixedAsset> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      const response = await axios.patch<FixedAssetApiRecord>(
        `${COMPANY_BASE_URL}/${targetId}/fixed-assets/${id}/retire`,
        {
          retirement_date: retirementDate,
          disposal_amount: disposalAmount,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-company-id": targetId,
          },
        },
      );

      return this.mapAsset(response.data);
    });
  }

  static async updateAllDepreciation(): Promise<void> {
    return Promise.resolve();
  }

  static calculateDepreciation(
    asset: FixedAsset,
    asOfDate: Date = new Date(),
  ): {
    annualDepreciation: number;
    monthsUsed: number;
    accumulatedDepreciation: number;
    currentBookValue: number;
  } {
    const acquisitionDate = new Date(asset.acquisitionDate);
    const endDate = asset.retirementDate ? new Date(asset.retirementDate) : asOfDate;
    const monthsUsed = this.getMonthsDifference(acquisitionDate, endDate);

    if (asset.depreciationMethod === "straight_line") {
      const annualDepreciation = (asset.acquisitionCost - asset.residualValue) / asset.usefulLifeYears;
      const monthlyDepreciation = annualDepreciation / 12;
      const accumulatedDepreciation = Math.min(
        monthlyDepreciation * monthsUsed,
        asset.acquisitionCost - asset.residualValue,
      );
      const currentBookValue = Math.max(
        asset.acquisitionCost - accumulatedDepreciation,
        asset.residualValue,
      );

      return {
        annualDepreciation,
        monthsUsed,
        accumulatedDepreciation,
        currentBookValue,
      };
    }

    return {
      annualDepreciation: 0,
      monthsUsed,
      accumulatedDepreciation: 0,
      currentBookValue: asset.acquisitionCost,
    };
  }

  static getAssetSummary(assets: FixedAsset[]): AssetSummary {
    return {
      totalAssets: assets.length,
      totalOriginalCost: assets.reduce((sum, asset) => sum + asset.acquisitionCost, 0),
      totalCurrentValue: assets.reduce((sum, asset) => sum + asset.currentBookValue, 0),
      totalDepreciation: assets.reduce((sum, asset) => {
        if (asset.status === "disposed" && asset.disposalAmount !== null && asset.disposalAmount !== undefined) {
          return sum + Math.max(0, asset.acquisitionCost - asset.disposalAmount);
        }

        return sum + this.calculateDepreciation(asset).accumulatedDepreciation;
      }, 0),
      activeAssets: assets.filter((asset) => asset.status === "active").length,
      retiredAssets: assets.filter((asset) => asset.status !== "active").length,
    };
  }

  static exportToCSV(assets: FixedAsset[]): string {
    const headers = [
      "Asset Name",
      "Category",
      "Acquisition Date",
      "Original Cost (RWF)",
      "Current Value (RWF)",
      "Depreciation Method",
      "Useful Life (Years)",
      "Location",
      "Status",
    ];

    return [
      headers.join(","),
      ...assets.map((asset) =>
        [
          asset.name,
          asset.category,
          asset.acquisitionDate,
          asset.acquisitionCost,
          asset.currentBookValue,
          asset.depreciationMethod,
          asset.usefulLifeYears,
          asset.location,
          asset.status,
        ].join(","),
      ),
    ].join("\n");
  }

  static getDepreciationSchedule(asset: FixedAsset): Array<{
    year: number;
    openingValue: number;
    depreciation: number;
    closingValue: number;
  }> {
    const schedule = [];
    const annualDepreciation = (asset.acquisitionCost - asset.residualValue) / asset.usefulLifeYears;
    let currentValue = asset.acquisitionCost;

    for (let year = 1; year <= asset.usefulLifeYears; year += 1) {
      const openingValue = currentValue;
      const depreciation = Math.min(annualDepreciation, currentValue - asset.residualValue);
      currentValue = Math.max(currentValue - depreciation, asset.residualValue);

      schedule.push({
        year,
        openingValue,
        depreciation,
        closingValue: currentValue,
      });

      if (currentValue <= asset.residualValue) {
        break;
      }
    }

    return schedule;
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: "RWF",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  private static mapAsset(record: FixedAssetApiRecord): FixedAsset {
    const baseAsset: FixedAsset = {
      id: Number(record.id),
      name: record.name,
      category: record.category,
      acquisitionDate: record.acquisition_date,
      acquisitionCost: Number(record.acquisition_cost || 0),
      depreciationMethod: record.depreciation_method || "straight_line",
      usefulLifeYears: Number(record.useful_life_years || 0),
      residualValue: Number(record.residual_value || 0),
      currentBookValue: 0,
      location: record.location || "",
      supplier: record.supplier,
      status: record.status || "active",
      retirementDate: record.retirement_date,
      disposalAmount:
        record.disposal_amount === null || record.disposal_amount === undefined
          ? null
          : Number(record.disposal_amount),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };

    const calculated = this.calculateDepreciation(baseAsset);
    const currentBookValue =
      baseAsset.status === "disposed" && baseAsset.disposalAmount !== null && baseAsset.disposalAmount !== undefined
        ? baseAsset.disposalAmount
        : calculated.currentBookValue;

    return {
      ...baseAsset,
      currentBookValue,
    };
  }

  private static getMonthsDifference(date1: Date, date2: Date): number {
    const months = (date2.getFullYear() - date1.getFullYear()) * 12;
    return Math.max(0, months - date1.getMonth() + date2.getMonth());
  }
}

export default FixedAssetService;
