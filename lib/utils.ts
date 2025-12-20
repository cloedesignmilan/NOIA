import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getDateRange(range: 'month' | 'quarter' | 'year' | 'all'): { from: Date; to: Date } {
    const now = new Date();
    const from = new Date();
    const to = new Date();

    // Reset hours to start/end of day logic
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);

    switch (range) {
        case 'month':
            from.setDate(1); // 1st of current month
            // to is already end of today? No, usually end of MONTH.
            // If I want "Current Month view", I usually want 1st to End of Month.
            to.setFullYear(from.getFullYear(), from.getMonth() + 1, 0);
            break;
        case 'quarter':
            const currentMonth = now.getMonth();
            const startMonth = Math.floor(currentMonth / 3) * 3;
            from.setMonth(startMonth, 1);
            // End of quarter
            to.setFullYear(from.getFullYear(), startMonth + 3, 0);
            break;
        case 'year':
            from.setMonth(0, 1); // Jan 1st
            to.setFullYear(from.getFullYear(), 11, 31); // Dec 31st
            break;
        case 'all':
            from.setFullYear(2000, 0, 1);
            to.setFullYear(2100, 11, 31); // Far future
            break;
    }

    return { from, to };
}
