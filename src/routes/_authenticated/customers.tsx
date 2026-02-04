import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Plus } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/customers')({
  component: CustomersPage,
});

function CustomersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage your agency&apos;s client companies
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>
            View and manage your client companies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Building2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium mb-1">No customers yet</h3>
            <p className="text-sm max-w-sm mb-4">
              Get started by adding your first customer. Customers represent the companies you work with.
            </p>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add your first customer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
