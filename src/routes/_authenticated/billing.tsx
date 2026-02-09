import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Building2, Users, UserCircle, Check, Loader2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { UpgradeButton } from '@/components/billing/UpgradeButton';
import { UsageProgress } from '@/components/billing/UsageProgress';

export const Route = createFileRoute('/_authenticated/billing')({
  component: BillingPage,
});

// Plan display info (client-side constants matching convex/lemonsqueezy/plans.ts)
type PlanInfo = {
  name: string;
  price: string;
  description: string;
  features: string[];
  limits: { maxCustomers: number; maxStaff: number; maxClients: number };
  variantId?: string;
};

const PLAN_DISPLAY_INFO: Record<string, PlanInfo> = {
  Free: {
    name: 'Free',
    price: '$0',
    description: 'For small teams getting started',
    features: [
      'Up to 3 customers',
      'Up to 2 team members',
      'Up to 10 external users',
      'Basic support',
    ],
    limits: { maxCustomers: 3, maxStaff: 2, maxClients: 10 },
  },
  Pro: {
    name: 'Pro',
    price: '$29',
    description: 'For growing teams',
    features: [
      'Up to 25 customers',
      'Up to 10 team members',
      'Up to 100 external users',
      'Priority support',
      'Custom branding',
    ],
    limits: { maxCustomers: 25, maxStaff: 10, maxClients: 100 },
    variantId: 'VARIANT_PRO', // TODO: Replace with actual variant ID
  },
  Business: {
    name: 'Business',
    price: '$99',
    description: 'For large teams',
    features: [
      'Up to 100 customers',
      'Up to 50 team members',
      'Up to 500 external users',
      '24/7 dedicated support',
      'Custom integrations',
    ],
    limits: { maxCustomers: 100, maxStaff: 50, maxClients: 500 },
    variantId: 'VARIANT_BUSINESS', // TODO: Replace with actual variant ID
  },
};

function BillingPage() {
  const usageStats = useQuery(api.billing.queries.getUsageStats);
  const billingInfo = useQuery(api.billing.queries.getBillingInfo);
  const org = useQuery(api.orgs.get.getMyOrg);
  const getPortalUrl = useAction(api.billing.actions.getCustomerPortalUrl);

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  const cancelSubscription = useAction(api.billing.actions.cancelSubscription);

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      await cancelSubscription({});
      setShowCancelDialog(false);
      // Show success feedback (console for now, toast in future)
      console.log('Subscription cancelled successfully');
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleViewInvoices = async () => {
    setIsLoadingPortal(true);
    try {
      const result = await getPortalUrl({});
      if (result.portalUrl) {
        window.open(result.portalUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to get customer portal URL:', error);
    } finally {
      setIsLoadingPortal(false);
    }
  };

  // Loading state
  if (usageStats === undefined || billingInfo === undefined || org === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentPlanName = usageStats.plan.name;
  const subscriptionStatus = usageStats.plan.status;
  const isActive = subscriptionStatus === 'active';
  const isCancelled = subscriptionStatus === 'cancelled';
  const hasSubscription = billingInfo.subscriptionId !== undefined && billingInfo.subscriptionId !== null;

  // Calculate trial status
  const isTrialing = billingInfo.isTrialing;
  const trialDaysRemaining = billingInfo.trialDaysRemaining || 0;
  const trialExpiringWarning = trialDaysRemaining <= 3;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and usage
        </p>
      </div>

      {/* Trial Banner */}
      {isTrialing && (
        <Alert className={trialExpiringWarning ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20' : 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'}>
          <AlertCircle className={`h-4 w-4 ${trialExpiringWarning ? 'text-amber-600' : 'text-blue-600'}`} />
          <AlertDescription className={trialExpiringWarning ? 'text-amber-900 dark:text-amber-100' : 'text-blue-900 dark:text-blue-100'}>
            You're on a 14-day free trial of Pro. {trialDaysRemaining} {trialDaysRemaining === 1 ? 'day' : 'days'} remaining.{' '}
            {PLAN_DISPLAY_INFO.Pro.variantId && org && (
              <UpgradeButton
                variantId={PLAN_DISPLAY_INFO.Pro.variantId}
                email={org.billingEmail || billingInfo.name}
                orgName={org.name}
                orgConvexId={org._id}
              >
                <Button variant="link" className="h-auto p-0 text-blue-700 dark:text-blue-300">
                  Upgrade Now
                </Button>
              </UpgradeButton>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                Your active subscription and status
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">{currentPlanName}</Badge>
              {isTrialing && <Badge variant="outline">Trial</Badge>}
              {isActive && !isTrialing && <Badge variant="default">Active</Badge>}
              {isCancelled && <Badge variant="destructive">Cancelled</Badge>}
              {!isActive && !isCancelled && <Badge variant="outline">Inactive</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Cancellation notice */}
            {isCancelled && billingInfo.endsAt && (
              <Alert>
                <AlertDescription>
                  Your subscription has been cancelled and will remain active until{' '}
                  {new Date(billingInfo.endsAt).toLocaleDateString()}.
                </AlertDescription>
              </Alert>
            )}

            {/* Manage Subscription button for active subscriptions */}
            {isActive && !isCancelled && hasSubscription && (
              <div>
                <Button onClick={handleViewInvoices} disabled={isLoadingPortal} variant="outline">
                  {isLoadingPortal && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Manage Subscription
                </Button>
              </div>
            )}

            {/* Upgrade button for free tier or cancelled */}
            {(!hasSubscription || isCancelled) && org && (
              <div className="flex gap-2">
                {PLAN_DISPLAY_INFO.Pro.variantId && (
                  <UpgradeButton
                    variantId={PLAN_DISPLAY_INFO.Pro.variantId}
                    email={org.billingEmail || billingInfo.name}
                    orgName={org.name}
                    orgConvexId={org._id}
                  >
                    Upgrade to Pro
                  </UpgradeButton>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Current Usage</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <UsageProgress
            label="Customers"
            used={usageStats.usage.customers.count}
            max={usageStats.usage.customers.max}
            icon={Building2}
          />
          <UsageProgress
            label="Team Members"
            used={usageStats.usage.staff.count}
            max={usageStats.usage.staff.max}
            icon={Users}
          />
          <UsageProgress
            label="External Users"
            used={usageStats.usage.clients.count}
            max={usageStats.usage.clients.max}
            icon={UserCircle}
          />
        </div>
      </div>

      {/* Available Plans */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Object.keys(PLAN_DISPLAY_INFO).map((planKey) => {
            const plan = PLAN_DISPLAY_INFO[planKey];
            const isCurrent = currentPlanName === plan.name;

            return (
              <Card key={plan.name} className={isCurrent ? 'border-primary' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{plan.name}</CardTitle>
                    {isCurrent && <Badge>Current Plan</Badge>}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold">
                    {plan.price}
                    {plan.price !== '$0' && (
                      <span className="text-sm font-normal text-muted-foreground">/month</span>
                    )}
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {org && (
                    <div>
                      {isCurrent ? (
                        <Button variant="outline" className="w-full" disabled>
                          Current Plan
                        </Button>
                      ) : plan.variantId ? (
                        <UpgradeButton
                          variantId={plan.variantId}
                          email={org.billingEmail || billingInfo.name}
                          orgName={org.name}
                          orgConvexId={org._id}
                        >
                          <Button className="w-full">Upgrade</Button>
                        </UpgradeButton>
                      ) : (
                        <Button className="w-full" disabled>
                          Upgrade
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Invoice Section */}
      {hasSubscription && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Invoices</h2>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-4">
                View your billing history and download receipts
              </p>
              <Button onClick={handleViewInvoices} disabled={isLoadingPortal} variant="outline">
                {isLoadingPortal && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                View Invoices & Receipts
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {!hasSubscription && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Invoices</h2>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                No invoices yet. Subscribe to a plan to view your billing history.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cancel Subscription Section */}
      {isActive && !isCancelled && hasSubscription && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Danger Zone</h2>
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold mb-1">Cancel Subscription</h3>
                  <p className="text-sm text-muted-foreground">
                    You'll retain access until the end of your current billing period
                  </p>
                </div>
                <Button variant="destructive" onClick={() => setShowCancelDialog(true)}>
                  Cancel Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Your subscription will remain active until the end of your current billing period.
              After that, your workspace will be downgraded to the Free plan with reduced limits.
              Your data will be preserved but you won't be able to create new resources beyond Free tier limits.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Cancellation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
