import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, CreditCard, TrendingUp } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of your agency.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Customers"
          value="0"
          description="Active clients"
          icon={Building2}
          trend="+2 this month"
        />
        <StatCard
          title="Team Members"
          value="1"
          description="Staff & admins"
          icon={Users}
          trend="Just you"
        />
        <StatCard
          title="Plan"
          value="Free"
          description="Current tier"
          icon={CreditCard}
          trend="Upgrade available"
        />
        <StatCard
          title="Active Projects"
          value="0"
          description="In progress"
          icon={TrendingUp}
          trend="No active projects"
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activity */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates from your agency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <div className="rounded-full bg-muted p-3 mb-3">
                <TrendingUp className="h-6 w-6" />
              </div>
              <p>No activity yet</p>
              <p className="text-sm">Get started by creating your first customer</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <QuickActionButton
              label="Create Organization"
              description="Set up your agency profile"
              href="/onboarding"
            />
            <QuickActionButton
              label="Add Customer"
              description="Add a new client"
              href="/customers/new"
            />
            <QuickActionButton
              label="Invite Team Member"
              description="Add staff to your agency"
              href="/team/invite"
            />
            <QuickActionButton
              label="Upgrade Plan"
              description="Unlock more features"
              href="/billing"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trend: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        <p className="text-xs text-green-600 mt-1">{trend}</p>
      </CardContent>
    </Card>
  );
}

function QuickActionButton({
  label,
  description,
  href,
}: {
  label: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex flex-col items-start rounded-lg border p-3 text-left transition-colors hover:bg-muted"
    >
      <span className="font-medium">{label}</span>
      <span className="text-sm text-muted-foreground">{description}</span>
    </a>
  );
}
