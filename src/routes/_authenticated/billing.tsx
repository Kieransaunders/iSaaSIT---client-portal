import { createFileRoute } from '@tanstack/react-router';
import { useAction, useQuery } from 'convex/react';
import { AlertCircle, Building2, Check, Loader2, UserCircle, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
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
import { UpgradeButton } from '@/components/billing/UpgradeButton';
import { UsageProgress } from '@/components/billing/UsageProgress';
import { getAvailablePlans, isBillingConfigured } from '@/config/billing';

export const Route = createFileRoute('/_authenticated/billing')({
  component: BillingPage,
});

function BillingPage() {
  const hasOrgCheck = useQuery(api.orgs.get.hasOrg);
  const canAccessBilling = !!hasOrgCheck?.hasOrg && hasOrgCheck.role === 'admin';
  const usageStats = useQuery(api.billing.queries.getUsageStats, canAccessBilling ? {} : 'skip');
  const billingInfo = useQuery(api.billing.queries.getBillingInfo, canAccessBilling ? {} : 'skip');
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
      toast.success('Subscription cancelled successfully');
    } catch (error) {
      toast.error('Failed to cancel subscription. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleViewInvoices = async () => {
    setIsLoadingPortal(true);
    try {
      const result = await getPortalUrl({});
      if (result.url) {
        window.open(result.url, '_blank');
      }
    } catch (error) {
      toast.error('Failed to open customer portal. Please try again.');
    } finally {
      setIsLoadingPortal(false);
    }
  };

  if (hasOrgCheck === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasOrgCheck.hasOrg) {
    return (
      <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-900 dark:text-amber-100">
          You're not assigned to an organization yet. Ask an admin to invite you or complete onboarding.
        </AlertDescription>
      </Alert>
    );
  }

  if (hasOrgCheck.role !== 'admin') {
    return (
      <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-900 dark:text-amber-100">
          Billing is only available to organization admins.
        </AlertDescription>
      </Alert>
    );
  }

  // Loading state
  if (usageStats === undefined || billingInfo === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentPlanName = usageStats.plan.name;
  const subscriptionStatus = usageStats.plan.status;
  const isActive = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';
  const isCancelled = subscriptionStatus === 'cancelled' || subscriptionStatus === 'canceled';
  const hasSubscription = !!billingInfo.subscriptionId;

  // Calculate trial status
  const isTrialing = billingInfo.isTrialing;
  const trialDaysRemaining = billingInfo.trialDaysRemaining || 0;
  const trialExpiringWarning = trialDaysRemaining <= 3;

  // Get available plans from config
  const availablePlans = getAvailablePlans();
  const proPlan = availablePlans.find((p) => p.id === 'proMonthly');
  const billingEnabled = isBillingConfigured();

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and usage</p>
      </div>

      {/* Billing Not Configured Warning */}
      {!billingEnabled && (
        <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900 dark:text-amber-100">
            Billing is not configured. Set <code>VITE_POLAR_SERVER</code> in your environment to enable paid plans.
          </AlertDescription>
        </Alert>
      )}

      {/* Trial Banner */}
      {isTrialing && proPlan && billingEnabled && (
        <Alert
          className={
            trialExpiringWarning
              ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20'
              : 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
          }
        >
          <AlertCircle className={`h-4 w-4 ${trialExpiringWarning ? 'text-amber-600' : 'text-blue-600'}`} />
          <AlertDescription
            className={trialExpiringWarning ? 'text-amber-900 dark:text-amber-100' : 'text-blue-900 dark:text-blue-100'}
          >
            You&apos;re on a 14-day free trial of Pro. {trialDaysRemaining} {trialDaysRemaining === 1 ? 'day' : 'days'}{' '}
            remaining.{' '}
            {proPlan.productKey !== undefined && (
              <UpgradeButton
                productKey={proPlan.productKey}
                variant="link"
                className="h-auto p-0 text-blue-700 dark:text-blue-300"
              >
                Upgrade Now
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
              <CardDescription>Your active subscription and status</CardDescription>
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
            {billingEnabled && (!hasSubscription || isCancelled) && proPlan?.productKey && (
              <div className="flex gap-2">
                <UpgradeButton productKey={proPlan.productKey}>Upgrade to Pro</UpgradeButton>
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
      {billingEnabled && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {availablePlans.map((plan) => {
              const isCurrent = currentPlanName === plan.name;

              return (
                <Card key={plan.id} className={isCurrent ? 'border-primary' : ''}>
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
                      {plan.price !== '$0' && plan.interval && (
                        <span className="text-sm font-normal text-muted-foreground">/{plan.interval}</span>
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
                    <div>
                      {isCurrent ? (
                        <Button variant="outline" className="w-full" disabled>
                          Current Plan
                        </Button>
                      ) : plan.productKey ? (
                        <UpgradeButton productKey={plan.productKey} className="w-full">
                          Upgrade
                        </UpgradeButton>
                      ) : (
                        <Button className="w-full" disabled>
                          Not Available
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Invoice Section */}
      {hasSubscription && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Invoices</h2>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-4">View your billing history and download receipts</p>
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
                    You&apos;ll retain access until the end of your current billing period
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
              Your subscription will remain active until the end of your current billing period. After that, your
              workspace will be downgraded to the Free plan with reduced limits. Your data will be preserved but you
              won&apos;t be able to create new resources beyond Free tier limits.
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
