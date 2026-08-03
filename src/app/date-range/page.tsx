
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { format, isWithinInterval, startOfDay, endOfDay, getYear } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Info, ArrowRight } from 'lucide-react';
import { cn, getCategoryIcon } from '@/lib/utils';
import { getExpenses, getYearsWithExpenses } from '@/lib/sheets';
import { Expense, PAID_BY_OPTIONS } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ExpenseList } from '@/components/expense-list';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const TIME_ZONE = 'Asia/Kolkata';

export default function DateRangeAnalysisPage() {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    if (!dateRange.from || !dateRange.to) return;
    
    setIsLoading(true);
    try {
      // Get unique years in the range
      const startYear = getYear(dateRange.from);
      const endYear = getYear(dateRange.to);
      const uniqueYears = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
      
      const allExpenses: Expense[] = [];
      for (const year of uniqueYears) {
        const yearExpenses = await getExpenses(year);
        allExpenses.push(...yearExpenses);
      }
      
      setExpenses(allExpenses);
    } catch (error) {
      console.error("Failed to load range data", error);
      toast({
        variant: "destructive",
        title: "Error loading data",
        description: "Could not fetch expenses for the selected range.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredExpenses = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return [];
    
    const start = startOfDay(dateRange.from);
    const end = endOfDay(dateRange.to);

    return expenses.filter(expense => {
      const expenseDate = toZonedTime(new Date(expense.date), TIME_ZONE);
      return isWithinInterval(expenseDate, { start, end });
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, dateRange]);

  const totalSum = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [filteredExpenses]);

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const expense of filteredExpenses) {
      totals[expense.category] = (totals[expense.category] ?? 0) + expense.amount;
    }
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  const paidByTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const expense of filteredExpenses) {
      const key = expense.paidBy ?? 'Unknown';
      totals[key] = (totals[key] ?? 0) + expense.amount;
    }
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">Date Range Analysis</h1>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Select Period</CardTitle>
            <CardDescription>Pick a start and end date to see the total spending breakdown.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-4">
            <div className="grid gap-2">
              <span className="text-sm font-medium">From</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? format(dateRange.from, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(d) => setDateRange(prev => ({ ...prev, from: d }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <ArrowRight className="h-4 w-4 mt-6 hidden sm:block text-muted-foreground" />
            
            <div className="grid gap-2">
              <span className="text-sm font-medium">To</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.to ? format(dateRange.to, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(d) => setDateRange(prev => ({ ...prev, to: d }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Spending</CardTitle>
            <CardDescription>Inclusive of all categories</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col justify-center h-[100px]">
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <div className="text-4xl font-bold text-primary">
                {totalSum.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By Category</CardTitle>
            <CardDescription>Spending breakdown per category</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : categoryTotals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data for this range.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {categoryTotals.map(([category, total]) => (
                  <div key={category} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {getCategoryIcon(category, {})}
                      <span className="truncate">{category}</span>
                    </div>
                    <span className="font-medium whitespace-nowrap">
                      {total.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By Paid By</CardTitle>
            <CardDescription>Spending breakdown per payer</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : paidByTotals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data for this range.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {paidByTotals.map(([payer, total]) => (
                  <div key={payer} className="flex items-center justify-between gap-2">
                    <span className="truncate">{payer}</span>
                    <span className="font-medium whitespace-nowrap">
                      {total.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Calculation Note</AlertTitle>
        <AlertDescription>
          The total sum calculated here includes <strong>all expenses</strong> within the selected date range, including Credit Card transactions, food card expenses, and cash transactions. This matches the daily totals displayed in your Transactions tab.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Transactions in Period</CardTitle>
          <CardDescription>
            {filteredExpenses.length} transaction(s) found.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : (
            <ExpenseList 
              expenses={filteredExpenses} 
              onEdit={() => {}} 
              onDelete={() => {}} 
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
