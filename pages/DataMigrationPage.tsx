// Data Migration Page Component

import React, { useState } from 'react';
import { Database, Download, Upload, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import {
    migrateLocalStorageToSupabase,
    backupLocalStorageData,
    MigrationProgress,
    MigrationResult
} from '../lib/migration/localStorage-to-supabase';

export default function DataMigrationPage() {
    const [migrating, setMigrating] = useState(false);
    const [progress, setProgress] = useState<MigrationProgress | null>(null);
    const [result, setResult] = useState<MigrationResult | null>(null);
    const [backupId, setBackupId] = useState<string | null>(null);

    const handleStartMigration = async () => {
        // Create backup first
        const id = backupLocalStorageData();
        setBackupId(id);

        setMigrating(true);
        setResult(null);

        try {
            const migrationResult = await migrateLocalStorageToSupabase((prog) => {
                setProgress(prog);
            });

            setResult(migrationResult);
        } catch (error: any) {
            setResult({
                success: false,
                migratedCounts: { contacts: 0, deals: 0, activities: 0 },
                errors: [{ entity: 'migration', id: 'error', error: error.message }]
            });
        } finally {
            setMigrating(false);
        }
    };

    const downloadBackup = () => {
        if (!backupId) return;

        const backupData = localStorage.getItem(`crm_backup_${backupId}`);
        if (backupData) {
            const blob = new Blob([backupData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `crm-backup-${backupId}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Database className="h-8 w-8 text-blue-600" />
                        <h1 className="text-2xl font-bold text-gray-900">Data Migration</h1>
                    </div>
                    <p className="text-gray-600">
                        Migrate your existing CRM data from localStorage to Supabase. This process will transfer
                        all your contacts, deals, and activities to the cloud database.
                    </p>
                </div>

                {/* Warning */}
                {!result && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-lg">
                        <div className="flex items-start">
                            <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
                            <div>
                                <h3 className="text-sm font-medium text-yellow-800">Important</h3>
                                <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
                                    <li>A backup will be created automatically before migration</li>
                                    <li>Ensure you have a stable internet connection</li>
                                    <li>Do not close this page until migration is complete</li>
                                    <li>This process may take a few minutes depending on data size</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Migration Progress */}
                {migrating && progress && (
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">{progress.stage}</span>
                                <span className="text-sm font-medium text-gray-900">{progress.percentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress.percentage}%` }}
                                />
                            </div>
                        </div>
                        <div className="text-sm text-gray-600">
                            Processing: {progress.current} of {progress.total}
                        </div>
                        {progress.errors.length > 0 && (
                            <div className="mt-3 text-sm text-yellow-600">
                                {progress.errors.length} error(s) encountered
                            </div>
                        )}
                    </div>
                )}

                {/* Migration Result */}
                {result && (
                    <div className={`rounded-lg shadow-lg p-6 mb-6 ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className="flex items-start gap-3">
                            {result.success ? (
                                <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
                            ) : (
                                <XCircle className="h-6 w-6 text-red-600 mt-1" />
                            )}
                            <div className="flex-1">
                                <h3 className={`text-lg font-semibold ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                                    {result.success ? 'Migration Completed Successfully!' : 'Migration Completed with Errors'}
                                </h3>
                                <div className="mt-4 grid grid-cols-3 gap-4">
                                    <div className="bg-white rounded-lg p-3">
                                        <div className="text-2xl font-bold text-gray-900">{result.migratedCounts.contacts}</div>
                                        <div className="text-sm text-gray-600">Contacts Migrated</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-3">
                                        <div className="text-2xl font-bold text-gray-900">{result.migratedCounts.deals}</div>
                                        <div className="text-sm text-gray-600">Deals Migrated</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-3">
                                        <div className="text-2xl font-bold text-gray-900">{result.migratedCounts.activities}</div>
                                        <div className="text-sm text-gray-600">Activities Migrated</div>
                                    </div>
                                </div>

                                {result.errors.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="text-sm font-semibold text-red-900 mb-2">
                                            Errors ({result.errors.length})
                                        </h4>
                                        <div className="bg-white rounded-lg p-3 max-h-48 overflow-y-auto">
                                            {result.errors.map((error, index) => (
                                                <div key={index} className="text-sm text-red-700 mb-2">
                                                    <span className="font-medium">{error.entity}</span>: {error.error}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="space-y-4">
                        {!result && (
                            <button
                                onClick={handleStartMigration}
                                disabled={migrating}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                {migrating ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Migrating Data...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-5 w-5" />
                                        Start Migration
                                    </>
                                )}
                            </button>
                        )}

                        {backupId && (
                            <button
                                onClick={downloadBackup}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                <Download className="h-5 w-5" />
                                Download Backup
                            </button>
                        )}

                        {result && (
                            <button
                                onClick={() => window.location.href = '/'}
                                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Go to Dashboard
                            </button>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
                    <div className="flex items-start">
                        <Database className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
                        <div className="text-sm text-blue-700">
                            <p className="font-medium mb-2">What happens during migration?</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>All data is backed up to your browser's localStorage</li>
                                <li>Data is validated before being transferred to Supabase</li>
                                <li>ID mappings are maintained for relationships between entities</li>
                                <li>You can download the backup file for your records</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
