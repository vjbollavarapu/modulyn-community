# Multi-Factor Authentication (MFA) Implementation

**Date**: 2025-01-27  
**Status**: ✅ **COMPLETE**  
**Type**: TOTP (Time-based One-Time Password)

---

## 📋 Overview

Modulyn ERP implements TOTP-based Multi-Factor Authentication (MFA) to enhance account security. Users can enable MFA using authenticator apps like Google Authenticator, Authy, or Microsoft Authenticator.

---

## ✅ Implementation Status

### **Complete Features**

- ✅ TOTP device setup with QR code generation
- ✅ TOTP token verification
- ✅ MFA enable/disable functionality
- ✅ Backup codes for account recovery
- ✅ MFA status checking
- ✅ MFA verification during login
- ✅ Integration with login flow
- ✅ Rate limiting on MFA endpoints

---

## 🔧 Technical Implementation

### **Models**

#### TOTPDevice
- **Location**: `apps/backend/apps/accounts/models.py`
- **Fields**:
  - `user`: OneToOne relationship with User
  - `secret`: Base32 encoded TOTP secret
  - `is_enabled`: MFA enabled status
  - `is_verified`: Device verification status
  - `last_used`: Last successful MFA verification
  - `backup_codes_generated`: Backup codes generation status

#### BackupCode
- **Location**: `apps/backend/apps/accounts/models.py`
- **Fields**:
  - `user`: ForeignKey to User
  - `code`: Hashed backup code (SHA256)
  - `is_used`: Whether code has been used
  - `used_at`: Timestamp when code was used

### **API Endpoints**

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/v1/auth/mfa/setup/` | POST | Generate TOTP secret and QR code | Yes |
| `/api/v1/auth/mfa/verify/` | POST | Verify TOTP token during setup | Yes |
| `/api/v1/auth/mfa/enable/` | POST | Enable MFA after verification | Yes |
| `/api/v1/auth/mfa/disable/` | POST | Disable MFA | Yes |
| `/api/v1/auth/mfa/status/` | GET | Get MFA status | Yes |
| `/api/v1/auth/mfa/login-verify/` | POST | Verify MFA during login | No |
| `/api/v1/auth/mfa/backup-codes/` | POST | Regenerate backup codes | Yes |

---

## 📖 Usage Guide

### **1. Setting Up MFA**

#### Step 1: Generate TOTP Secret
```bash
POST /api/v1/auth/mfa/setup/
Authorization: Bearer <access_token>

Response:
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qr_code": "data:image/png;base64,...",
  "provisioning_uri": "otpauth://totp/Modulyn%20ERP:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Modulyn%20ERP",
  "message": "Scan the QR code with your authenticator app, then verify with a token."
}
```

#### Step 2: Scan QR Code
- Open authenticator app (Google Authenticator, Authy, etc.)
- Scan the QR code or manually enter the secret
- Note the 6-digit code generated

#### Step 3: Verify Token
```bash
POST /api/v1/auth/mfa/verify/
Authorization: Bearer <access_token>
{
  "token": "123456"
}

Response:
{
  "message": "TOTP verified successfully. You can now enable MFA."
}
```

#### Step 4: Enable MFA
```bash
POST /api/v1/auth/mfa/enable/
Authorization: Bearer <access_token>
{
  "token": "123456"
}

Response:
{
  "message": "MFA enabled successfully.",
  "backup_codes": ["ABC12345", "DEF67890", ...],
  "warning": "Save these backup codes in a secure location. They will not be shown again."
}
```

### **2. Login with MFA**

#### Step 1: Initial Login
```bash
POST /api/v1/auth/login/
{
  "email": "user@example.com",
  "password": "password123"
}

Response (if MFA enabled):
{
  "mfa_required": true,
  "email": "user@example.com",
  "message": "MFA verification required. Please provide TOTP token or backup code."
}
```

#### Step 2: Verify MFA
```bash
POST /api/v1/auth/mfa/login-verify/
{
  "email": "user@example.com",
  "token": "123456"  // OR "backup_code": "ABC12345"
}

Response:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "user"
  },
  "message": "MFA verified successfully."
}
```

### **3. Checking MFA Status**

```bash
GET /api/v1/auth/mfa/status/
Authorization: Bearer <access_token>

Response:
{
  "mfa_enabled": true,
  "mfa_verified": true,
  "backup_codes_count": 8,
  "last_used": "2025-01-27T12:00:00Z"
}
```

### **4. Disabling MFA**

```bash
POST /api/v1/auth/mfa/disable/
Authorization: Bearer <access_token>
{
  "password": "current_password"
}

Response:
{
  "message": "MFA disabled successfully."
}
```

### **5. Regenerating Backup Codes**

```bash
POST /api/v1/auth/mfa/backup-codes/
Authorization: Bearer <access_token>

Response:
{
  "backup_codes": ["NEW12345", "NEW67890", ...],
  "warning": "Save these backup codes in a secure location. They will not be shown again."
}
```

---

## 🔒 Security Features

### **Rate Limiting**
- **Setup/Verify**: 10 requests/minute per user
- **Enable/Disable**: 5 requests/minute per user
- **Login Verify**: 10 requests/minute per IP
- **Backup Codes**: 3 requests/hour per user

### **Token Validation**
- TOTP tokens verified with 1-time-window tolerance
- Backup codes are single-use and hashed (SHA256)
- Tokens expire after use

### **Best Practices**
- Secrets are base32 encoded
- Backup codes are hashed before storage
- QR codes generated server-side
- MFA status checked on every login

---

## 🧪 Testing

### **Manual Testing**

1. **Setup MFA**:
   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/mfa/setup/ \
     -H "Authorization: Bearer <token>"
   ```

2. **Verify Token**:
   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/mfa/verify/ \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"token": "123456"}'
   ```

3. **Enable MFA**:
   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/mfa/enable/ \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"token": "123456"}'
   ```

4. **Test Login Flow**:
   ```bash
   # Step 1: Login
   curl -X POST http://localhost:8000/api/v1/auth/login/ \
     -H "Content-Type: application/json" \
     -d '{"email": "user@example.com", "password": "password123"}'
   
   # Step 2: Verify MFA (if required)
   curl -X POST http://localhost:8000/api/v1/auth/mfa/login-verify/ \
     -H "Content-Type: application/json" \
     -d '{"email": "user@example.com", "token": "123456"}'
   ```

---

## 📚 Dependencies

- **pyotp**: TOTP token generation and verification
- **qrcode**: QR code generation for authenticator apps
- **django-ratelimit**: Rate limiting protection

---

## ✅ Verification Checklist

- [x] TOTP device model created
- [x] Backup code model created
- [x] MFA setup endpoint implemented
- [x] MFA verification endpoint implemented
- [x] MFA enable/disable endpoints implemented
- [x] Login flow integrated with MFA
- [x] Backup codes generation implemented
- [x] Rate limiting configured
- [x] URLs configured
- [x] Serializers created
- [x] Documentation complete

---

## 🎯 Next Steps (Optional Enhancements)

- [ ] SMS-based MFA (alternative to TOTP)
- [ ] Email-based MFA codes
- [ ] Hardware security key support (WebAuthn)
- [ ] MFA recovery via email
- [ ] MFA device management (multiple devices)

---

**Last Updated**: 2025-01-27  
**Status**: ✅ **COMPLETE** - MFA via TOTP fully implemented and functional

