import { ValueEvent, Contract, RealityIncome } from "./types";

export function calculateEventAmount(
  units: number,
  payRate: number
): number {
  return units * payRate;
}

export function calculateDailyTotal(events: ValueEvent[]): number {
  return events.reduce((sum, event) => sum + event.amount, 0);
}

export function calculateRunningBalance(
  allEvents: ValueEvent[],
  upToDate: string
): number {
  const filteredEvents = allEvents.filter((e) => e.date <= upToDate);
  return calculateDailyTotal(filteredEvents);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function calculateGoalProgress(
  currentBalance: number,
  contract: Contract | null
): number {
  if (!contract || contract.annualGoal === 0) return 0;
  return Math.min((currentBalance / contract.annualGoal) * 100, 100);
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateString(dateStr: string): Date {
  // Parse YYYY-MM-DD in local timezone (not UTC)
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return formatDate(date1) === formatDate(date2);
}

export function getWeekDateRange(date: Date): { start: string; end: string } {
  const day = date.getDay();
  const start = new Date(date);
  start.setDate(date.getDate() - day);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    start: formatDate(start),
    end: formatDate(end),
  };
}

export function getMonthDateRange(date: Date): { start: string; end: string } {
  const year = date.getFullYear();
  const month = date.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return {
    start: formatDate(start),
    end: formatDate(end),
  };
}

export function calculateWeeklyTotal(
  allEvents: ValueEvent[],
  date: Date
): number {
  const { start, end } = getWeekDateRange(date);
  const weekEvents = allEvents.filter(
    (e) => e.date >= start && e.date <= end
  );
  return calculateDailyTotal(weekEvents);
}

export function calculateMonthlyTotal(
  allEvents: ValueEvent[],
  date: Date
): number {
  const { start, end } = getMonthDateRange(date);
  const monthEvents = allEvents.filter(
    (e) => e.date >= start && e.date <= end
  );
  return calculateDailyTotal(monthEvents);
}

export function calculateWeeklyGoal(contract: Contract | null): number {
  if (!contract) return 0;
  return contract.annualGoal / 52;
}

export function calculateMonthlyGoal(contract: Contract | null): number {
  if (!contract) return 0;
  return contract.annualGoal / 12;
}

export function calculateRealityIncomeTotal(incomes: RealityIncome[]): number {
  return incomes.reduce((sum, income) => sum + income.amount, 0);
}

export function calculateNetDailyTotal(
  events: ValueEvent[],
  incomes: RealityIncome[]
): number {
  const deposits = calculateDailyTotal(events);
  const realityIncome = calculateRealityIncomeTotal(incomes);
  return deposits - realityIncome;
}

export function calculateNetRunningBalance(
  allEvents: ValueEvent[],
  allIncomes: RealityIncome[],
  upToDate: string
): number {
  const filteredEvents = allEvents.filter((e) => e.date <= upToDate);
  const filteredIncomes = allIncomes.filter((i) => i.date <= upToDate);
  const totalDeposits = calculateDailyTotal(filteredEvents);
  const totalRealityIncome = calculateRealityIncomeTotal(filteredIncomes);
  return totalDeposits - totalRealityIncome;
}

export function calculateNetWeeklyTotal(
  allEvents: ValueEvent[],
  allIncomes: RealityIncome[],
  date: Date
): number {
  const { start, end } = getWeekDateRange(date);
  const weekEvents = allEvents.filter((e) => e.date >= start && e.date <= end);
  const weekIncomes = allIncomes.filter((i) => i.date >= start && i.date <= end);
  return calculateNetDailyTotal(weekEvents, weekIncomes);
}

export function calculateNetMonthlyTotal(
  allEvents: ValueEvent[],
  allIncomes: RealityIncome[],
  date: Date
): number {
  const { start, end } = getMonthDateRange(date);
  const monthEvents = allEvents.filter((e) => e.date >= start && e.date <= end);
  const monthIncomes = allIncomes.filter((i) => i.date >= start && i.date <= end);
  return calculateNetDailyTotal(monthEvents, monthIncomes);
}

export function calculateNetGoalProgress(
  netBalance: number,
  contract: Contract | null
): number {
  if (!contract || contract.annualGoal === 0) return 0;
  const progress = (netBalance / contract.annualGoal) * 100;
  return Math.max(0, Math.min(progress, 100));
}
