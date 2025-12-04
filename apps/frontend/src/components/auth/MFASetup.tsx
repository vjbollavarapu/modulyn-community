import { useState } from "react";
import { QrCode, Shield, CheckCircle2, XCircle, Loader2, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import apiClient from "@/services/api";

interface MFASetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

type SetupStep = "setup" | "verify" | "enable" | "complete";

export function MFASetup({ onComplete, onCancel }: MFASetupProps) {
  const [step, setStep] = useState<SetupStep>("setup");
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [provisioningUri, setProvisioningUri] = useState<string>("");
  const [verificationToken, setVerificationToken] = useState("");
  const [enableToken, setEnableToken] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSetup = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await apiClient.mfaSetup();
      setQrCode(response.data.qr_code);
      setSecret(response.data.secret);
      setProvisioningUri(response.data.provisioning_uri);
      setStep("verify");
      toast.success("QR Code Generated", "Scan the QR code with your authenticator app");
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to set up MFA");
      toast.error("Setup Failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationToken || verificationToken.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      await apiClient.mfaVerify(verificationToken);
      setStep("enable");
      setVerificationToken("");
      toast.success("Verification Successful", "You can now enable MFA");
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Invalid verification code");
      toast.error("Verification Failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnable = async () => {
    if (!enableToken || enableToken.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const response = await apiClient.mfaEnable(enableToken);
      if (response.data.backup_codes) {
        setBackupCodes(response.data.backup_codes);
        setStep("complete");
      } else {
        setStep("complete");
      }
      toast.success("MFA Enabled", "Multi-factor authentication is now active");
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to enable MFA");
      toast.error("Enable Failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    toast.success("Secret Copied", "Secret key copied to clipboard");
  };

  const downloadBackupCodes = () => {
    const content = backupCodes.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modulyn-backup-codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Backup Codes Downloaded", "Save them in a secure location");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Set Up Multi-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Setup Step */}
          {step === "setup" && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  MFA adds an extra layer of security by requiring a code from your authenticator app in addition to your password.
                </AlertDescription>
              </Alert>
              <div className="flex gap-4">
                <Button onClick={handleSetup} disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <QrCode className="mr-2 h-4 w-4" />
                      Start Setup
                    </>
                  )}
                </Button>
                {onCancel && (
                  <Button variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Verify Step */}
          {step === "verify" && (
            <div className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                  <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium">Scan this QR code with your authenticator app</p>
                  <p className="text-xs text-muted-foreground">
                    Use Google Authenticator, Authy, Microsoft Authenticator, or any TOTP-compatible app
                  </p>
                </div>
                <div className="w-full space-y-2">
                  <Label>Or enter this secret manually:</Label>
                  <div className="flex gap-2">
                    <Input value={secret} readOnly className="font-mono text-sm" />
                    <Button variant="outline" size="icon" onClick={copySecret}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Enter the 6-digit code from your app</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="text-center text-2xl font-mono tracking-widest"
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="flex gap-4">
                <Button onClick={handleVerify} disabled={isLoading || verificationToken.length !== 6} className="flex-1">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Verify
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setStep("setup")}>
                  Back
                </Button>
              </div>
            </div>
          )}

          {/* Enable Step */}
          {step === "enable" && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Verification successful! Enter one more code to enable MFA.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label>Enter the 6-digit code from your app</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={enableToken}
                  onChange={(e) => setEnableToken(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="text-center text-2xl font-mono tracking-widest"
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="flex gap-4">
                <Button onClick={handleEnable} disabled={isLoading || enableToken.length !== 6} className="flex-1">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enabling...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Enable MFA
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setStep("verify")}>
                  Back
                </Button>
              </div>
            </div>
          )}

          {/* Complete Step */}
          {step === "complete" && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600 font-medium">
                  MFA has been successfully enabled!
                </AlertDescription>
              </Alert>
              {backupCodes.length > 0 && (
                <div className="space-y-4">
                  <Alert variant="default">
                    <AlertDescription>
                      <strong>Important:</strong> Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <Label>Backup Codes</Label>
                    <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
                      {backupCodes.map((code, index) => (
                        <code key={index} className="text-sm font-mono text-center p-2 bg-background rounded">
                          {code}
                        </code>
                      ))}
                    </div>
                    <Button variant="outline" onClick={downloadBackupCodes} className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Download Backup Codes
                    </Button>
                  </div>
                </div>
              )}
              <Button onClick={onComplete} className="w-full">
                Done
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

