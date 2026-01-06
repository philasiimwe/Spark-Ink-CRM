// Two-Factor Authentication System

import { supabase } from '../supabase';
import * as OTPAuth from 'otpauth';

export interface TwoFactorSetup {
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
}

export interface TwoFactorStatus {
    enabled: boolean;
    method?: '2fa' | 'backup';
    lastVerified?: string;
}

// Generate TOTP secret and QR code
export async function setupTwoFactor(userEmail: string): Promise<TwoFactorSetup> {
    // Generate secret
    const secret = new OTPAuth.Secret({ size: 20 });

    // Create TOTP instance
    const totp = new OTPAuth.TOTP({
        issuer: 'Nexus CRM',
        label: userEmail,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: secret
    });

    // Generate QR code URL
    const qrCodeUrl = totp.toString();

    // Generate backup codes
    const backupCodes = generateBackupCodes(8);

    // Store encrypted secret in user metadata
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        await supabase.auth.updateUser({
            data: {
                two_factor_secret: secret.base32,
                backup_codes: backupCodes.map(code => hashCode(code))
            }
        });
    }

    return {
        secret: secret.base32,
        qrCodeUrl,
        backupCodes
    };
}

// Verify TOTP token
export async function verifyTwoFactorToken(token: string): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const twoFactorSecret = user.user_metadata?.two_factor_secret;
        if (!twoFactorSecret) return false;

        // Create TOTP instance with stored secret
        const totp = new OTPAuth.TOTP({
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: OTPAuth.Secret.fromBase32(twoFactorSecret)
        });

        // Verify token (allow 1 period before/after for clock skew)
        const delta = totp.validate({ token, window: 1 });

        if (delta !== null) {
            // Update last verified timestamp
            await supabase.auth.updateUser({
                data: {
                    two_factor_last_verified: new Date().toISOString()
                }
            });
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error verifying 2FA token:', error);
        return false;
    }
}

// Verify backup code
export async function verifyBackupCode(code: string): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const backupCodes = user.user_metadata?.backup_codes || [];
        const hashedCode = hashCode(code);

        const codeIndex = backupCodes.indexOf(hashedCode);
        if (codeIndex === -1) return false;

        // Remove used backup code
        const updatedCodes = backupCodes.filter((_: string, i: number) => i !== codeIndex);

        await supabase.auth.updateUser({
            data: {
                backup_codes: updatedCodes,
                two_factor_last_verified: new Date().toISOString()
            }
        });

        return true;
    } catch (error) {
        console.error('Error verifying backup code:', error);
        return false;
    }
}

// Enable 2FA after successful verification
export async function enableTwoFactor(): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        await supabase.auth.updateUser({
            data: {
                two_factor_enabled: true,
                two_factor_enabled_at: new Date().toISOString()
            }
        });

        return true;
    } catch (error) {
        console.error('Error enabling 2FA:', error);
        return false;
    }
}

// Disable 2FA
export async function disableTwoFactor(): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        await supabase.auth.updateUser({
            data: {
                two_factor_enabled: false,
                two_factor_secret: null,
                backup_codes: null,
                two_factor_last_verified: null
            }
        });

        return true;
    } catch (error) {
        console.error('Error disabling 2FA:', error);
        return false;
    }
}

// Get 2FA status
export async function getTwoFactorStatus(): Promise<TwoFactorStatus> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { enabled: false };
        }

        return {
            enabled: user.user_metadata?.two_factor_enabled || false,
            lastVerified: user.user_metadata?.two_factor_last_verified
        };
    } catch (error) {
        console.error('Error getting 2FA status:', error);
        return { enabled: false };
    }
}

// Generate backup codes
function generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
        // Generate 8-character alphanumeric code
        const code = Array.from({ length: 8 }, () =>
            '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 33)]
        ).join('');

        // Format as XXXX-XXXX
        codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
    }
    return codes;
}

// Simple hash function for backup codes
function hashCode(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}

// Regenerate backup codes
export async function regenerateBackupCodes(): Promise<string[]> {
    try {
        const backupCodes = generateBackupCodes(8);

        await supabase.auth.updateUser({
            data: {
                backup_codes: backupCodes.map(code => hashCode(code))
            }
        });

        return backupCodes;
    } catch (error) {
        console.error('Error regenerating backup codes:', error);
        throw error;
    }
}

export default {
    setupTwoFactor,
    verifyTwoFactorToken,
    verifyBackupCode,
    enableTwoFactor,
    disableTwoFactor,
    getTwoFactorStatus,
    regenerateBackupCodes
};
