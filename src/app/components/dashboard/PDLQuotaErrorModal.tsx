"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface PDLQuotaErrorModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PDLQuotaErrorModal({ isOpen, onClose }: PDLQuotaErrorModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-500">
            <AlertTriangle size={24} />
            <DialogTitle>PDL API Quota Limit Reached</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Your People Data Labs (PDL) API quota limit has been reached. This is not a technical issue with our application, but a billing limitation with the PDL service.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">Quota Limit Details</h3>
                <div className="mt-2 text-sm text-amber-700">
                  <ul className="list-disc space-y-1 pl-5">
                    <li>Your PDL API account has reached its monthly quota limit</li>
                    <li>This is a billing issue, not a technical problem</li>
                    <li>The PDL API returns a 402 Payment Required error when this happens</li>
                    <li>You need to upgrade your PDL plan to continue using this feature</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Next Steps:</h4>
            <ol className="list-decimal pl-5 space-y-1 text-sm">
              <li>Log into your PDL account dashboard</li>
              <li>Upgrade your plan or add more API credits</li>
              <li>Contact PDL support if you need assistance with billing</li>
              <li>Try again after 10 minutes or an hour your quota has been increased</li>
            </ol>
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button 
            onClick={() => window.open("https://dashboard.peopledatalabs.com/", "_blank")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Go to PDL Dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
