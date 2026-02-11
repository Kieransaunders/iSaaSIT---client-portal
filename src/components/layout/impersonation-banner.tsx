import { useMutation, useQuery } from "convex/react";
import { UserCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";

export function ImpersonationBanner() {
    const impersonatedUser = useQuery(api.users.impersonate.getImpersonationStatus);
    const stopImpersonating = useMutation(api.users.impersonate.stopImpersonating);

    if (!impersonatedUser) return null;

    const handleStop = async () => {
        try {
            await stopImpersonating();
            toast.success("Stopped impersonating");
            // Refresh the page to reset all states
            window.location.reload();
        } catch (error) {
            toast.error("Failed to stop impersonating");
        }
    };

    return (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between animate-in fade-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <UserCheck className="h-4 w-4" />
                <span>
                    Viewing as <span className="font-bold">{impersonatedUser.firstName || impersonatedUser.email}</span> ({impersonatedUser.role})
                </span>
            </div>
            <Button
                variant="outline"
                size="sm"
                onClick={handleStop}
                className="h-8 gap-2 bg-background border-primary/30 hover:bg-primary/5 hover:text-primary transition-colors"
            >
                <XCircle className="h-4 w-4" />
                Stop Impersonating
            </Button>
        </div>
    );
}
