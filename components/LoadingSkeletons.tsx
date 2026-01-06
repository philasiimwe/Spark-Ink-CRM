// Loading Skeleton Components for Enhanced UX

import React from 'react';

interface SkeletonProps {
    className?: string;
    width?: string;
    height?: string;
    variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    width,
    height,
    variant = 'rectangular'
}) => {
    const baseClasses = 'skeleton shimmer';
    const variantClasses = {
        text: 'h-4',
        circular: 'rounded-full',
        rectangular: 'rounded-lg'
    };

    const style: React.CSSProperties = {};
    if (width) style.width = width;
    if (height) style.height = height;

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
    rows = 5,
    columns = 4
}) => {
    return (
        <div className="space-y-4 animate-fade-in">
            {/* Table Header */}
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={`header-${i}`} height="12px" className="bg-gray-300" />
                ))}
            </div>

            {/* Table Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div
                    key={`row-${rowIndex}`}
                    className="grid gap-4"
                    style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
                >
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton key={`cell-${rowIndex}-${colIndex}`} height="16px" />
                    ))}
                </div>
            ))}
        </div>
    );
};

export const CardSkeleton: React.FC = () => {
    return (
        <div className="card p-6 space-y-4 animate-fade-in">
            {/* Card Header */}
            <div className="flex items-center justify-between">
                <Skeleton width="120px" height="24px" />
                <Skeleton variant="circular" width="40px" height="40px" />
            </div>

            {/* Card Content */}
            <div className="space-y-3">
                <Skeleton height="16px" width="80%" />
                <Skeleton height="16px" width="60%" />
                <Skeleton height="16px" width="90%" />
            </div>

            {/* Card Footer */}
            <div className="flex gap-2 pt-4">
                <Skeleton width="80px" height="32px" className="rounded-full" />
                <Skeleton width="80px" height="32px" className="rounded-full" />
            </div>
        </div>
    );
};

export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 5 }) => {
    return (
        <div className="space-y-3 animate-fade-in">
            {Array.from({ length: items }).map((_, index) => (
                <div key={`list-item-${index}`} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
                    <Skeleton variant="circular" width="48px" height="48px" />
                    <div className="flex-1 space-y-2">
                        <Skeleton height="16px" width="40%" />
                        <Skeleton height="12px" width="60%" />
                    </div>
                    <Skeleton width="80px" height="24px" className="rounded-full" />
                </div>
            ))}
        </div>
    );
};

export const DashboardCardSkeleton: React.FC = () => {
    return (
        <div className="card card-gradient p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
                <Skeleton width="100px" height="20px" />
                <Skeleton variant="circular" width="36px" height="36px" />
            </div>
            <Skeleton height="36px" width="60%" className="mb-2" />
            <Skeleton height="14px" width="80%" />
        </div>
    );
};

export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = '300px' }) => {
    return (
        <div className="card p-6 animate-fade-in">
            <div className="mb-6">
                <Skeleton width="150px" height="24px" className="mb-2" />
                <Skeleton width="200px" height="14px" />
            </div>
            <Skeleton height={height} className="rounded-lg" />
        </div>
    );
};

export const FormSkeleton: React.FC = () => {
    return (
        <div className="space-y-6 animate-fade-in">
            {Array.from({ length: 4 }).map((_, index) => (
                <div key={`form-field-${index}`} className="space-y-2">
                    <Skeleton width="100px" height="16px" />
                    <Skeleton height="44px" className="rounded-lg" />
                </div>
            ))}
            <div className="flex gap-3 pt-4">
                <Skeleton width="100px" height="44px" className="rounded-lg" />
                <Skeleton width="100px" height="44px" className="rounded-lg" />
            </div>
        </div>
    );
};

export const ProfileSkeleton: React.FC = () => {
    return (
        <div className="flex items-center gap-4 animate-fade-in">
            <Skeleton variant="circular" width="64px" height="64px" />
            <div className="flex-1 space-y-2">
                <Skeleton height="20px" width="150px" />
                <Skeleton height="16px" width="200px" />
            </div>
        </div>
    );
};

// Generic loading spinner with modern design
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
    size = 'md',
    className = ''
}) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    };

    return (
        <div className={`${sizeClasses[size]} ${className}`}>
            <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                />
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
            </svg>
        </div>
    );
};

export default {
    Skeleton,
    TableSkeleton,
    CardSkeleton,
    ListSkeleton,
    DashboardCardSkeleton,
    ChartSkeleton,
    FormSkeleton,
    ProfileSkeleton,
    LoadingSpinner
};
