import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, ShieldCheck, ShieldOff, Loader2, Key, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import apiClient from "@/services/api";
import { MFASetup } from "./MFASetup";

export function MFAStatus() {
  const [showSetup, setShowSetup] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [isDisabling, setIsDisabling] = useState(false);
  const queryClient = useQueryClient();

  const { data: mfaStatus, isLoading } = useQuery({
    queryKey: ["mfa", "status"],
    queryFn: async () => {
      const response = await apiClient.mfaStatus();
      return response.data;
    },
  });

  const regenerateBackupCodes = useMutation({
    mutationFn: async () => {
      const response = await apiClient.mfaRegenerateBackupCodes();
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Backup Codes Regenerated", "Save them in a secure location");
      queryClient.invalidateQueries({ queryKey: ["mfa", "status"] });
      // Show backup codes in a dialog
      const codes = data.backup_codes.join("\n");
      navigator.clipboard.writeText(codes);
      toast.info("Backup Codes Copied", "Codes have been copied to your clipboard");
    },
    onError: (error: any) => {
      toast.error("Failed to Regenerate", error.response?.data?.error || error.message);
    },
  });

  const handleDisable = async () => {
    if (!disablePassword) {
      toast.error("Password Required", "Please enter your password to disable MFA");
      return;
    }

    setIsDisabling(true);
    try {
      await apiClient.mfaDisable(disablePassword);
      toast.success("MFA Disabled", "Multi-factor authentication has been disabled");
      setDisablePassword("");
      queryClient.invalidateQueries({ queryKey: ["mfa", "status"] });
    } catch (error: any) {
      toast.error("Failed to Disable", error.response?.data?.error || error.message);
    } finally {
      setIsDisabling(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (showSetup) {
    return (
      <div>
        <Button variant="ghost" onClick={() => setShowSetup(false)} className="mb-4">
          ← Back to Status
        </Button>
        <MFASetup
          onComplete={() => {
            setShowSetup(false);
            queryClient.invalidateQueries({ queryKey: ["mfa", "status"] });
          }}
          onCancel={() => setShowSetup(false)}
        />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Multi-Factor Authentication
        </CardTitle>
        <CardDescription>
          Manage your account's two-factor authentication settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {mfaStatus?.mfa_enabled ? (
          <>
            <Alert>
              <ShieldCheck className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600 font-medium">
                MFA is currently enabled and protecting your account
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p className="text-sm font-medium">Enabled</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Backup Codes</Label>
                  <p className="text-sm font-medium">
                    {mfaStatus.backup_codes_count} remaining
                  </p>
                </div>
                {mfaStatus.last_used && (
                  <div>
                    <Label className="text-muted-foreground">Last Used</Label>
                    <p className="text-sm font-medium">
                      {new Date(mfaStatus.last_used).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => regenerateBackupCodes.mutate()}
                  disabled={regenerateBackupCodes.isPending}
                >
                  {regenerateBackupCodes.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <Key className="mr-2 h-4 w-4" />
                      Regenerate Backup Codes
                    </>
                  )}
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <ShieldOff className="mr-2 h-4 w-4" />
                      Disable MFA
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Disable Multi-Factor Authentication?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove the extra security layer from your account. You'll need to enter your password to confirm.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Enter your password to confirm</Label>
                        <Input
                          type="password"
                          value={disablePassword}
                          onChange={(e) => setDisablePassword(e.target.value)}
                          placeholder="Your password"
                        />
                      </div>
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDisable}
                        disabled={!disablePassword || isDisabling}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDisabling ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Disabling...
                          </>
                        ) : (
                          "Disable MFA"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </>
        ) : (
          <>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                MFA is not enabled. Enable it to add an extra layer of security to your account.
              </AlertDescription>
            </Alert>

            <Button onClick={() => setShowSetup(true)} className="w-full">
              <Shield className="mr-2 h-4 w-4" />
              Enable Multi-Factor Authentication
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

