import { createFileRoute } from '@tanstack/react-router';
import { useAction, useMutation, useQuery } from 'convex/react';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { InviteDialog } from '@/components/team/invite-dialog';
import { PendingTable, TeamTable } from '@/components/team/team-table';

export const Route = createFileRoute('/_authenticated/team')({
  component: TeamPage,
});

function TeamPage() {
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Queries
  const members = useQuery(api.users.queries.listOrgMembers);
  const counts = useQuery(api.users.queries.getOrgMemberCounts);
  const pendingInvitations = useQuery(api.invitations.queries.listPendingInvitations);

  // Mutations
  const removeUser = useMutation(api.users.manage.removeUser);
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
    } catch (error) {
      console.error('Failed to remove user:', error);
    }
  };

  const handleRestore = async (userId: Id<'users'>) => {
    try {
      await restoreUser({ userId });
    } catch (error) {
      console.error('Failed to restore user:', error);
    }
  };

  const handleRevoke = async (invitationId: Id<'pendingInvitations'>) => {
    try {
      await revokeInvitation({ invitationId });
    } catch (error) {
      console.error('Failed to revoke invitation:', error);
    }
  };

  const handleResend = async (invitationId: Id<'pendingInvitations'>) => {
    try {
      await resendInvitation({ invitationId });
    } catch (error) {
      console.error('Failed to resend invitation:', error);
    }
  };

  // Loading state
  const isLoading = members === undefined || counts === undefined;

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
            <TabsTrigger value="all">All ({counts?.totalActive ?? 0})</TabsTrigger>
            <TabsTrigger value="staff">Staff ({counts?.staffCount ?? 0})</TabsTrigger>
            <TabsTrigger value="clients">Clients ({counts?.clientCount ?? 0})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({counts?.pendingCount ?? 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <TeamTable members={allActiveMembers} onRemove={handleRemove} />
          </TabsContent>

          <TabsContent value="staff" className="mt-6">
            <TeamTable members={staffMembers} onRemove={handleRemove} />
          </TabsContent>

          <TabsContent value="clients" className="mt-6">
            <TeamTable members={clientMembers} onRemove={handleRemove} />
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
