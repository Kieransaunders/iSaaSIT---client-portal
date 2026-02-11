import { createFileRoute } from '@tanstack/react-router';
import { useAction, useMutation, useQuery } from 'convex/react';
import { useState } from 'react';
import { AlertCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { InviteDialog } from '@/components/team/invite-dialog';
import { PendingTable, TeamTable } from '@/components/team/team-table';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const Route = createFileRoute('/_authenticated/team')({
  component: TeamPage,
});

function TeamPage() {
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Queries
  const hasOrgCheck = useQuery(api.orgs.get.hasOrg);
  const isAdmin = hasOrgCheck?.role === 'admin';
  const members = useQuery(api.users.queries.listOrgMembers, isAdmin ? {} : 'skip');
  const counts = useQuery(api.users.queries.getOrgMemberCounts, isAdmin ? {} : 'skip');
  const pendingInvitations = useQuery(api.invitations.queries.listPendingInvitations, isAdmin ? {} : 'skip');

  // Mutations
  const removeUser = useAction(api.users.manageActions.removeUser);
  const restoreUser = useMutation(api.users.manage.restoreUser);

  // Actions
  const revokeInvitation = useAction(api.invitations.manage.revokeInvitation);
  const resendInvitation = useAction(api.invitations.manage.resendInvitation);

  // Derive filtered member lists
  const allActiveMembers = members?.filter((m) => m.status === 'active') || [];
  const staffMembers = members?.filter((m) => m.role === 'staff' && m.status === 'active') || [];
  const clientMembers = members?.filter((m) => m.role === 'client' && m.status === 'active') || [];

  // Handler functions
  const handleRemove = async (userId: Id<'users'>) => {
    try {
      await removeUser({ userId });
      toast.success('User deleted successfully');
    } catch (error) {
      toast.error('Failed to delete user. Please try again.');
    }
  };

  const handleRestore = async (userId: Id<'users'>) => {
    try {
      await restoreUser({ userId });
      toast.success('User restored successfully');
    } catch (error) {
      toast.error('Failed to restore user. Please try again.');
    }
  };

  const handleRevoke = async (invitationId: Id<'pendingInvitations'>) => {
    try {
      await revokeInvitation({ invitationId });
      toast.success('Invitation deleted successfully');
    } catch (error) {
      toast.error('Failed to revoke invitation. Please try again.');
    }
  };

  const handleResend = async (invitationId: Id<'pendingInvitations'>) => {
    try {
      await resendInvitation({ invitationId });
      toast.success('Invitation resent successfully');
    } catch (error) {
      toast.error('Failed to resend invitation. Please try again.');
    }
  };

  // Loading state
  const isLoading = members === undefined || counts === undefined || hasOrgCheck === undefined;

  if (hasOrgCheck === undefined) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </div>
    );
  }

  if (!hasOrgCheck.hasOrg) {
    return (
      <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-900 dark:text-amber-100">
          You&apos;re not assigned to an organization yet. Ask an admin to invite you or complete onboarding.
        </AlertDescription>
      </Alert>
    );
  }

  if (!isAdmin) {
    return (
      <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-900 dark:text-amber-100">
          Team management is only available to organization admins.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">Manage your team members and invitations</p>
        </div>
        <Button onClick={() => setIsInviteOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      {/* Tabs */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Defensive null handling */}
            <TabsTrigger value="all">All ({counts?.totalActive ?? 0})</TabsTrigger>
            {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Defensive null handling */}
            <TabsTrigger value="staff">Staff ({counts?.staffCount ?? 0})</TabsTrigger>
            {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Defensive null handling */}
            <TabsTrigger value="clients">Clients ({counts?.clientCount ?? 0})</TabsTrigger>
            {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Defensive null handling */}
            <TabsTrigger value="pending">Pending ({counts?.pendingCount ?? 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <TeamTable
              members={allActiveMembers}
              onRemove={handleRemove}
              isAdmin={isAdmin}
              currentUserId={hasOrgCheck.userId}
            />
          </TabsContent>

          <TabsContent value="staff" className="mt-6">
            <TeamTable
              members={staffMembers}
              onRemove={handleRemove}
              isAdmin={isAdmin}
              currentUserId={hasOrgCheck.userId}
            />
          </TabsContent>

          <TabsContent value="clients" className="mt-6">
            <TeamTable
              members={clientMembers}
              onRemove={handleRemove}
              isAdmin={isAdmin}
              currentUserId={hasOrgCheck.userId}
            />
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            <PendingTable
              invitations={pendingInvitations ?? []}
              onResend={handleResend}
              onRevoke={handleRevoke}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Invite Dialog */}
      <InviteDialog open={isInviteOpen} onOpenChange={setIsInviteOpen} />
    </div>
  );
}
