import { useState } from "react";
import { Shield, Loader2, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import apiClient from "@/services/api";

interface MFAVerifyProps {
  email: string;
  onSuccess: (tokens: { access: string; refresh: string; user: any }) => void;
  onError?: (error: string) => void;
}

export function MFAVerify({ email, onSuccess, onError }: MFAVerifyProps) {
  const [token, setToken] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async (useBackupCode: boolean = false) => {
    const code = useBackupCode ? backupCode : token;
    
    if (!code || (useBackupCode ? code.length < 8 : code.length !== 6)) {
      setError(useBackupCode ? "Please enter a valid backup code" : "Please enter a valid 6-digit code");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const response = await apiClient.mfaLoginVerify({
        email,
        ...(useBackupCode ? { backup_code: backupCode } : { token }),
      });
      
      if (response.data.access && response.data.refresh && response.data.user) {
        onSuccess({
          access: response.data.access,
          refresh: response.data.refresh,
          user: response.data.user,
        });
        toast.success("MFA Verified", "Login successful");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Verification failed";
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
      toast.error("Verification Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Multi-Factor Authentication Required
        </CardTitle>
        <CardDescription>
          Enter the code from your authenticator app or use a backup code
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="totp" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="totp">Authenticator Code</TabsTrigger>
            <TabsTrigger value="backup">Backup Code</TabsTrigger>
          </TabsList>
          
          <TabsContent value="totp" className="space-y-4">
            <div className="space-y-2">
              <Label>Enter 6-digit code from your authenticator app</Label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="text-center text-2xl font-mono tracking-widest"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && token.length === 6) {
                    handleVerify(false);
                  }
                }}
              />
            </div>
            {error && !backupCode && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button
              onClick={() => handleVerify(false)}
              disabled={isLoading || token.length !== 6}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Verify
                </>
              )}
            </Button>
          </TabsContent>
          
          <TabsContent value="backup" className="space-y-4">
            <Alert>
              <AlertDescription>
                Use a backup code if you don't have access to your authenticator app.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label>Enter backup code</Label>
              <Input
                type="text"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                placeholder="XXXXXXXX"
                className="text-center text-lg font-mono tracking-wider"
                maxLength={8}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && backupCode.length >= 8) {
                    handleVerify(true);
                  }
                }}
              />
            </div>
            {error && backupCode && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button
              onClick={() => handleVerify(true)}
              disabled={isLoading || backupCode.length < 8}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  Verify Backup Code
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

