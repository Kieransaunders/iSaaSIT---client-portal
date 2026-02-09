import { useState } from 'react';
import { format } from 'date-fns';
import { RotateCcw, Trash2, UserCircle } from 'lucide-react';
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
}

export function TeamTable({ members, onRemove, onRestore }: TeamTableProps) {
  const [userToRemove, setUserToRemove] = useState<TeamMember | null>(null);

  const handleRemoveClick = (member: TeamMember) => {
    setUserToRemove(member);
  };

  const handleConfirmRemove = () => {
    if (userToRemove && onRemove) {
      onRemove(userToRemove._id);
      setUserToRemove(null);
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
                  {member.status === 'active' && onRemove ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveClick(member)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
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
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {userToRemove?.displayName}? They will lose
              access to the organization.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
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
                      onClick={() => onRevoke(invitation._id)}
                      className="text-destructive hover:text-destructive"
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
