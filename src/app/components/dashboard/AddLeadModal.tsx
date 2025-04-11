// components/AddLeadModal.tsx
"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { findEmail } from "@/app/api/hunter";
import { Loader2, Plus } from "lucide-react";
import { saveLead } from "@/lib/supabase/leads";

export function AddLeadModal({ onLeadAdded }: { onLeadAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foundEmail, setFoundEmail] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    domain: "",
    company: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

// In your AddLeadModal component
const handleFindEmail = async () => {
  if (!formData.firstName || !formData.lastName || !formData.domain) {
    setError("First name, last name, and domain are required");
    return;
  }

  // Clean the domain input before sending
  const cleanDomain = formData.domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

  setIsLoading(true);
  setError(null);
  setFoundEmail(null);

  try {
    const result = await findEmail(
      formData.firstName,
      formData.lastName,
      formData.domain,
      formData.company
    );
    
    console.log('API Response:', result);
    setFoundEmail(result.email);
    
  } catch (err) {
    console.error('Detailed Error:', {
      error: err,
      inputs: formData,
      timestamp: new Date().toISOString()
    });
    setError(err instanceof Error ? err.message : "Failed to find email");
  } finally {
    setIsLoading(false);
  }
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!foundEmail) return;
  
    try {
      await saveLead({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: foundEmail,
        company: formData.company,
        domain: formData.domain,
        status: 'unverified', // You might want to use Hunter's verification status
      });
      
      onLeadAdded();
      setOpen(false);
    } catch (err) {
      setError('Failed to save lead to database');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-9 bg-orange-500 hover:bg-orange-600">
          <Plus className="mr-2 h-4 w-4" />
          Add Lead
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company (Optional)</Label>
            <Input
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="domain">Domain (e.g., example.com)</Label>
            <Input
              id="domain"
              name="domain"
              value={formData.domain}
              onChange={handleChange}
              placeholder="example.com" // Show example format
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter just the domain (e.g., whitecloak.com) without https:// or www
            </p>
          </div>

          <Button
            type="button"
            onClick={handleFindEmail}
            disabled={isLoading || !formData.firstName || !formData.lastName || !formData.domain}
            variant="outline"
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Find Email"
            )}
            Find Email
          </Button>

          {error && (
            <div className="text-sm text-red-500">{error}</div>
          )}

          {foundEmail && (
            <div className="space-y-2">
              <Label>Found Email</Label>
              <Input
                value={foundEmail}
                readOnly
                className="font-mono bg-gray-100"
              />
              <p className="text-sm text-gray-500">
                Email found with Hunter.io
              </p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={!foundEmail}>
            Add Lead
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}