// Client-side service for lead operations
import { Lead, LeadStatus } from "@/app/types/lead";
import { LeadSearchFilters, LeadSearchResults } from "@/services/leadGeneration/types";

// Server actions imported from their respective files
import { searchLeads as searchLeadsAction, getLeadServices as getLeadServicesAction } from "@/app/actions/searchLeads";

/**
 * Client-side service for lead operations that interfaces with server actions
 */
export class LeadService {
  /**
   * Get available lead generation services
   */
  static async getLeadServices() {
    try {
      // Import dynamically to avoid server component issues
      const { getLeadServices } = await import("@/app/actions/searchLeads");
      return await getLeadServices();
    } catch (error) {
      console.error("Error getting lead services:", error);
      return [];
    }
  }

  /**
   * Search for leads using multiple services
   */
  static async searchLeads(
    filters: LeadSearchFilters,
    options: {
      useServices?: string[];
      combineResults?: boolean;
    } = {}
  ): Promise<LeadSearchResults[]> {
    try {
      // Import dynamically to avoid server component issues
      const { searchLeads } = await import("@/app/actions/searchLeads");
      return await searchLeads(filters, options);
    } catch (error) {
      console.error("Error searching leads:", error);
      throw new Error(`Failed to search leads: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get saved leads from the database
   */
  static async getLeads(filter?: LeadStatus): Promise<Lead[]> {
    try {
      // Create a simple fetch request to a new API endpoint we'll create
      const response = await fetch(`/api/leads${filter ? `?status=${filter}` : ""}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch leads: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching leads:", error);
      return [];
    }
  }

  /**
   * Save a lead to the database
   */
  static async saveLead(
    leadData: {
      contact: {
        firstName: string;
        lastName: string;
        email: string;
        position?: string;
        emailQuality: {
          deliverable: boolean;
          quality_score: string;
          is_valid_format: boolean;
        };
        linkedinUrl?: string;
        phoneNumber?: string;
        phoneType?: string;
        phoneCountry?: string;
        phoneData?: any;
      };
      company: {
        name: string;
        domain: string;
        industry?: string;
        size?: string;
        location?: {
          country: string;
          locality: string;
        };
      };
      profile?: {
        summary?: string;
        experiences?: Array<{
          company: string;
          title: string;
          duration: string;
        }>;
        education?: Array<{
          school: string;
          degree: string;
        }>;
      };
    }
  ): Promise<Lead> {
    try {
      // Create a simple fetch request to a new API endpoint we'll create
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(leadData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to save lead: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error saving lead:", error);
      throw new Error(`Failed to save lead: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}
