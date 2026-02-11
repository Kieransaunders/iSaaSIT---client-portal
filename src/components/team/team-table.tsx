import { useState } from 'react';
import { format } from 'date-fns';
import { RotateCcw, Trash2, UserCheck, UserCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface TeamMember {
  _id: Id<'users'>;
  firstName?: string;
  lastName?: string;
  email: string;
  role?: string;
  status: string;
  createdAt: number;
  deletedAt?: number;
  displayName: string;
}

interface TeamTableProps {
  members: Array<TeamMember>;
  onRemove?: (userId: Id<'users'>) => void;
  onRestore?: (userId: Id<'users'>) => void;
  isAdmin?: boolean;
  currentUserId?: Id<'users'>;
}

export function TeamTable({ members, onRemove, onRestore, isAdmin, currentUserId }: TeamTableProps) {
  const [userToRemove, setUserToRemove] = useState<TeamMember | null>(null);
  const impersonate = useMutation(api.users.impersonate.startImpersonating);

  const handleRemoveClick = (member: TeamMember) => {
    setUserToRemove(member);
  };

  const handleConfirmRemove = () => {
    if (userToRemove && onRemove) {
      onRemove(userToRemove._id);
      setUserToRemove(null);
    }
  };

  const handleImpersonate = async (userId: Id<'users'>) => {
    try {
      await impersonate({ targetUserId: userId });
      toast.success('Now impersonating user');
      // Full page reload to reset all route and data states properly
      window.location.reload();
    } catch (error) {
      toast.error('Failed to impersonate user');
    }
  };

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border rounded-lg">
        <div className="rounded-full bg-muted p-4 mb-4">
          <UserCircle className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-medium mb-1">No team members</h3>
        <p className="text-sm">Team members will appear here once invited</p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member._id}>
                <TableCell className="font-medium">
                  {member.displayName}
                </TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>
                  {member.role ? member.role.charAt(0).toUpperCase() + member.role.slice(1) : '-'}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={member.status === 'active' ? 'default' : 'destructive'}
                  >
                    {member.status === 'active' ? 'Active' : 'Removed'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(new Date(member.createdAt), 'MMM d, yyyy')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {member.status === 'active' && isAdmin && member._id !== currentUserId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleImpersonate(member._id)}
                        title="Impersonate this user"
                      >
                        <UserCheck className="h-4 w-4" />
                        <span className="sr-only md:not-sr-only md:ml-2">Act As</span>
                      </Button>
                    )}
                    {member.status === 'active' && onRemove ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveClick(member)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only md:not-sr-only md:ml-2">Delete</span>
                      </Button>
                    ) : member.status === 'removed' && onRestore ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRestore(member._id)}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Restore
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={!!userToRemove} onOpenChange={() => setUserToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToRemove?.displayName}? They will lose
              access to the organization.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface PendingInvitation {
  _id: Id<'pendingInvitations'>;
  email: string;
  role: string;
  customerName?: string;
  createdAt: number;
  expiresAt: number;
}

interface PendingTableProps {
  invitations: Array<PendingInvitation>;
  onResend?: (invitationId: Id<'pendingInvitations'>) => void;
  onRevoke?: (invitationId: Id<'pendingInvitations'>) => void;
}

export function PendingTable({ invitations, onResend, onRevoke }: PendingTableProps) {
  const [invitationToDelete, setInvitationToDelete] = useState<PendingInvitation | null>(null);

  const handleDeleteClick = (invitation: PendingInvitation) => {
    setInvitationToDelete(invitation);
  };

  const handleConfirmDelete = () => {
    if (invitationToDelete && onRevoke) {
      onRevoke(invitationToDelete._id);
      setInvitationToDelete(null);
    }
  };

  if (invitations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border rounded-lg">
        <div className="rounded-full bg-muted p-4 mb-4">
          <UserCircle className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-medium mb-1">No pending invitations</h3>
        <p className="text-sm">Invite your first team member</p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((invitation) => (
              <TableRow key={invitation._id}>
                <TableCell className="font-medium">{invitation.email}</TableCell>
                <TableCell>
                  {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                </TableCell>
                <TableCell>
                  {invitation.customerName || '-'}
                </TableCell>
                <TableCell>
                  {format(new Date(invitation.createdAt), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  {format(new Date(invitation.expiresAt), 'MMM d, yyyy')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {onResend && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onResend(invitation._id)}
                      >
                        Resend
                      </Button>
                    )}
                    {onRevoke && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(invitation)}
                        className="text-destructive hover:text-destructive"
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!invitationToDelete}
        onOpenChange={() => setInvitationToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the invitation for {invitationToDelete?.email}?
              They will no longer be able to join using this invite.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
