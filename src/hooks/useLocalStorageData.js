import { useState, useEffect } from 'react';

// Default starter data to avoid empty screens initially
const DEFAULT_DATA = {
    monthly_income: [],
    taxes: [],
    loans: [],
    investments: []
};

export function useLocalStorageData(table) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load from LocalStorage on mount
    useEffect(() => {
        const raw = localStorage.getItem(`ascend_${table}`);
        if (raw) {
            try {
                setData(JSON.parse(raw));
            } catch (e) {
                setData(DEFAULT_DATA[table] || []);
            }
        } else {
            setData(DEFAULT_DATA[table] || []);
        }
        setLoading(false);
    }, [table]);

    // Persist to LocalStorage whenever data changes
    useEffect(() => {
        if (!loading) {
            localStorage.setItem(`ascend_${table}`, JSON.stringify(data));
            // Dispatch a custom event so the Dashboard can listen and recalculate summary
            window.dispatchEvent(new Event('ascend_data_updated'));
        }
    }, [data, loading, table]);

    // CRUD Operations
    const addItem = (item) => {
        const newItem = { ...item, id: Date.now().toString(), created_at: new Date().toISOString() };
        setData(prev => [newItem, ...prev]);
        return newItem;
    };

    const updateItem = (id, updates) => {
        let updatedItem = null;
        setData(prev => prev.map(item => {
            if (item.id === id) {
                updatedItem = { ...item, ...updates };
                return updatedItem;
            }
            return item;
        }));
        return updatedItem;
    };

    const deleteItem = (id) => {
        setData(prev => prev.filter(item => item.id !== id));
    };

    return { data, loading, addItem, updateItem, deleteItem, setData };
}

// Helper to compute the dashboard summary across all tables
export function getDashboardSummary() {
    const getTable = (t) => JSON.parse(localStorage.getItem(`ascend_${t}`) || '[]');

    const income = getTable('monthly_income');
    const taxes = getTable('taxes');
    const loans = getTable('loans');
    const inv = getTable('investments');

    const cryptoValue = inv.filter(i => i.type === 'crypto').reduce((s, i) => s + (Number(i.current_value) || 0), 0);
    const stockValue = inv.filter(i => i.type === 'stock').reduce((s, i) => s + (Number(i.current_value) || 0), 0);
    const cashValue = inv.filter(i => i.type === 'transfer').reduce((s, i) => s + (Number(i.current_value) || 0), 0);

    const totalLoans = loans.reduce((s, l) => s + (Number(l.remaining_balance) || 0), 0);
    const totalTaxes = taxes.filter(t => t.status !== 'Paid').reduce((s, t) => s + (Number(t.estimated_amount || 0) - Number(t.paid_amount || 0)), 0);

    const netWorth = (cryptoValue + stockValue + cashValue) - (totalLoans + totalTaxes);

    // Format upcoming deadlines
    const upcomingDeadlines = [
        ...taxes
            .filter(t => t.status !== 'Paid' && t.due_date)
            .map(t => ({ category: 'tax', id: t.id, due_date: t.due_date, status: t.status, amount: t.estimated_amount, label: `Q${t.quarter} ${t.year}` })),
        ...loans
            .filter(l => Number(l.remaining_balance) > 0 && l.end_date)
            .map(l => ({ category: 'loan', id: l.id, due_date: l.end_date, status: '', amount: Number(l.base_payment || 0) + Number(l.extra_payment || 0), label: l.name }))
    ].sort((a, b) => new Date(a.due_date) - new Date(b.due_date)).slice(0, 10);

    return {
        netWorth: { cryptoValue, stockValue, cashValue, totalLoans, totalTaxes, netWorth },
        recentIncome: income.slice(0, 12),
        upcomingDeadlines
    };
}
