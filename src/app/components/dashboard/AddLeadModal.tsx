// components/AddLeadModal.tsx
'use client';

import { useState, useActionState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Plus, Check, X } from 'lucide-react';
import { handleLeadEnrichment } from '@/app/actions/enrichLead';
import { Badge } from '@/components/ui/badge';

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        'Find and Enrich Lead'
      )}
    </Button>
  );
}

interface EnrichmentStatus {
  emailFinder?: 'pending' | 'success' | 'error';
  emailValidation?: 'pending' | 'success' | 'error';
  companyEnrichment?: 'pending' | 'success' | 'error';
  profileEnrichment?: 'pending' | 'success' | 'error';
  phoneDiscovery?: 'pending' | 'success' | 'error';
}

export function AddLeadModal({ onLeadAdded }: { onLeadAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [enrichmentStatus, setEnrichmentStatus] = useState<EnrichmentStatus>({});
  const [state, formAction, isPending] = useActionState(handleLeadEnrichment, null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    domain: '',
    company: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Reset status when modal opens/closes
  useEffect(() => {
    if (open) {
      setEnrichmentStatus({});
    }
  }, [open]);

  // Handle the response from the server action
  useEffect(() => {
    if (state?.success) {
      setOpen(false);
      onLeadAdded();
    }
  }, [state, onLeadAdded]);

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      default:
        return null;
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
        </DialogHeader>
        <form action={formAction}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="domain">Domain *</Label>
            <Input
              id="domain"
              name="domain"
              value={formData.domain}
              onChange={handleChange}
              placeholder="example.com"
              required
            />
            <p className="text-xs text-gray-500">
              Enter just the domain (e.g., whitecloak.com) without https:// or www
            </p>
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

          {/* Enrichment Progress Indicator */}
          <div className="space-y-2">
            <Label>Enrichment Progress</Label>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                {getStatusIcon(enrichmentStatus.emailFinder)}
                <span>Email Discovery</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(enrichmentStatus.emailValidation)}
                <span>Email Validation</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(enrichmentStatus.companyEnrichment)}
                <span>Company Data</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(enrichmentStatus.profileEnrichment)}
                <span>Profile Data</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(enrichmentStatus.phoneDiscovery)}
                <span>Phone Discovery</span>
              </div>
            </div>
          </div>

          <SubmitButton pending={isPending} />

          {state?.error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {state.error}
            </div>
          )}

          {state?.success && (
            <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-600">
              Lead successfully added!
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}