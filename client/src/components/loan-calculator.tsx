import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Download, Calculator, ChartLine, Table, Calendar, Info, FileSpreadsheet } from "lucide-react";
import * as XLSX from 'xlsx';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { PercentageInput } from "@/components/ui/percentage-input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

import { loanInputSchema, LoanInput, PaymentRow, LoanSummary } from "@shared/schema";
import { calculateAmortizationSchedule, formatCurrency, formatPercentage } from "@/lib/financial-calculations";

export function LoanCalculator() {
  const [schedule, setSchedule] = React.useState<PaymentRow[]>([]);
  const [summary, setSummary] = React.useState<LoanSummary | null>(null);
  const [isCalculating, setIsCalculating] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [tableView, setTableView] = React.useState<'all' | 'rate-term' | 'year'>('rate-term');
  
  const itemsPerPage = 12;

  const form = useForm<LoanInput>({
    resolver: zodResolver(loanInputSchema),
    defaultValues: {
      loanAmount: 500000,
      annualInterestRate: 5.25,
      rateTermMonths: 60,
      amortizationMonths: 300,
      paymentsPerYear: 12,
      startDate: "2024-01-15",
      firstPaymentDate: "2024-02-15",
      rateTermMaturityDate: "2029-01-15",
      compoundingFrequency: 2,
      paymentType: "end",
    },
  });

  const onCalculate = async (data: LoanInput) => {
    setIsCalculating(true);
    try {
      const result = calculateAmortizationSchedule(data);
      setSchedule(result.schedule);
      setSummary(result.summary);
      setCurrentPage(1);
    } catch (error) {
      console.error("Calculation error:", error);
    } finally {
      setIsCalculating(false);
    }
  };

  // Auto-calculate when form values change
  React.useEffect(() => {
    const subscription = form.watch((values) => {
      if (form.formState.isValid && Object.values(values).every(v => v !== undefined && v !== '')) {
        onCalculate(values as LoanInput);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Filter schedule based on table view
  const filteredSchedule = React.useMemo(() => {
    if (!schedule.length) return [];
    
    const rateTermMaturity = new Date(form.getValues("rateTermMaturityDate"));
    
    switch (tableView) {
      case 'rate-term':
        return schedule.filter(payment => payment.paymentDate <= rateTermMaturity);
      case 'year':
        const currentYear = new Date().getFullYear();
        return schedule.filter(payment => payment.paymentDate.getFullYear() === currentYear);
      default:
        return schedule;
    }
  }, [schedule, tableView, form]);

  const paginatedSchedule = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSchedule.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSchedule, currentPage]);

  const totalPages = Math.ceil(filteredSchedule.length / itemsPerPage);

  const exportToCsv = () => {
    if (!schedule.length) return;
    
    const headers = [
      'Payment #',
      'Payment Date',
      'Beginning Balance',
      'Scheduled Payment',
      'Principal',
      'Interest',
      'Ending Balance',
      'Cumulative Interest',
      'Days'
    ];
    
    const csvContent = [
      headers.join(','),
      ...filteredSchedule.map(row => [
        row.paymentNumber,
        format(row.paymentDate, 'yyyy-MM-dd'),
        row.beginningBalance.toFixed(2),
        row.scheduledPayment.toFixed(2),
        row.principalPayment.toFixed(2),
        row.interestPayment.toFixed(2),
        row.endingBalance.toFixed(2),
        row.cumulativeInterest.toFixed(2),
        row.daysBetweenPayments
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amortization-schedule-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    if (!schedule.length || !summary) return;

    const formValues = form.getValues();
    
    // Create workbook and worksheets
    const workbook = XLSX.utils.book_new();
    
    // Loan Summary Sheet
    const summaryData = [
      ['Canadian Commercial Bank - Term Loan Calculator'],
      ['Generated on:', format(new Date(), 'MMM dd, yyyy')],
      [],
      ['Loan Details', 'Values'],
      ['Loan Amount (CAD)', formValues.loanAmount],
      ['Annual Interest Rate (%)', formValues.annualInterestRate],
      ['Rate Term (months)', formValues.rateTermMonths],
      ['Amortization Period (months)', formValues.amortizationMonths],
      ['Payments Per Year', formValues.paymentsPerYear],
      ['Start Date', format(new Date(formValues.startDate), 'MMM dd, yyyy')],
      ['First Payment Date', format(new Date(formValues.firstPaymentDate), 'MMM dd, yyyy')],
      ['Rate Term Maturity Date', format(new Date(formValues.rateTermMaturityDate), 'MMM dd, yyyy')],
      ['Compounding Frequency', formValues.compoundingFrequency],
      [],
      ['Calculated Results', 'Values'],
      ['Monthly Payment (CAD)', summary.monthlyPayment],
      ['Total Interest (CAD)', summary.totalInterest],
      ['Total of Payments (CAD)', summary.totalPayments],
      ['Rate Term Interest (CAD)', summary.rateTermInterest],
      ['Rate Term Principal (CAD)', summary.rateTermPrincipal],
      ['Number of Payments', summary.numberOfPayments]
    ];
    
    const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Set column widths for summary sheet
    summaryWorksheet['!cols'] = [
      { width: 30 }, // Column A - Labels
      { width: 20 }  // Column B - Values
    ];
    
    // Add summary sheet to workbook
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Loan Summary');
    
    // Amortization Schedule Sheet
    const scheduleHeaders = [
      'Payment #',
      'Payment Date',
      'Beginning Balance (CAD)',
      'Scheduled Payment (CAD)',
      'Principal Payment (CAD)',
      'Interest Payment (CAD)',
      'Ending Balance (CAD)',
      'Cumulative Interest (CAD)',
      'Days Between Payments'
    ];
    
    const scheduleData = [
      scheduleHeaders,
      ...filteredSchedule.map(row => [
        row.paymentNumber,
        format(row.paymentDate, 'yyyy-MM-dd'),
        row.beginningBalance,
        row.scheduledPayment,
        row.principalPayment,
        row.interestPayment,
        row.endingBalance,
        row.cumulativeInterest,
        row.daysBetweenPayments
      ])
    ];
    
    const scheduleWorksheet = XLSX.utils.aoa_to_sheet(scheduleData);
    
    // Set column widths for schedule sheet
    scheduleWorksheet['!cols'] = [
      { width: 12 }, // Payment #
      { width: 15 }, // Payment Date
      { width: 20 }, // Beginning Balance
      { width: 18 }, // Scheduled Payment
      { width: 18 }, // Principal Payment
      { width: 18 }, // Interest Payment
      { width: 20 }, // Ending Balance
      { width: 20 }, // Cumulative Interest
      { width: 15 }  // Days
    ];
    
    // Format currency columns (0-based indexing, rows start from 1 after header)
    const currencyColumns = [2, 3, 4, 5, 6, 7]; // Beginning Balance through Cumulative Interest
    const range = XLSX.utils.decode_range(scheduleWorksheet['!ref'] || 'A1');
    
    for (let row = 1; row <= range.e.r; row++) {
      for (const col of currencyColumns) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (scheduleWorksheet[cellRef] && typeof scheduleWorksheet[cellRef].v === 'number') {
          scheduleWorksheet[cellRef].z = '"$"#,##0.00';
        }
      }
    }
    
    // Add schedule sheet to workbook
    XLSX.utils.book_append_sheet(workbook, scheduleWorksheet, 'Amortization Schedule');
    
    // Generate and download the file
    const fileName = `loan-amortization-schedule-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CB</span>
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Canadian Commercial Bank</h1>
              </div>
              <Separator orientation="vertical" className="h-6" />
              <h2 className="text-lg font-medium text-gray-600">Term Loan Calculator</h2>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">CAD Currency</span>
              <Calculator className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Loan Input Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  <span>Loan Parameters</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onCalculate)} className="space-y-6">
                    
                    <FormField
                      control={form.control}
                      name="loanAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-1">
                            <span>Loan Amount (CAD)</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="w-4 h-4 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Total principal amount to be borrowed</p>
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
                          <FormControl>
                            <CurrencyInput
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="500,000"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="annualInterestRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-1">
                            <span>Annual Interest Rate</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="w-4 h-4 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Annual percentage rate for the loan</p>
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
                          <FormControl>
                            <PercentageInput
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="5.25"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rateTermMonths"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-1">
                            <span>Rate Term (Months)</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="w-4 h-4 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Period for which the interest rate is fixed</p>
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              placeholder="60"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="amortizationMonths"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-1">
                            <span>Amortization Period (Months)</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="w-4 h-4 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Total time to fully repay the loan</p>
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              placeholder="300"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentsPerYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-1">
                            <span>Payments Per Year</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="w-4 h-4 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Frequency of loan payments</p>
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
                          <Select value={field.value?.toString()} onValueChange={(value) => field.onChange(Number(value))}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select payment frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="12">Monthly (12)</SelectItem>
                              <SelectItem value="26">Bi-Weekly (26)</SelectItem>
                              <SelectItem value="24">Semi-Monthly (24)</SelectItem>
                              <SelectItem value="52">Weekly (52)</SelectItem>
                              <SelectItem value="4">Quarterly (4)</SelectItem>
                              <SelectItem value="2">Semi-Annually (2)</SelectItem>
                              <SelectItem value="1">Annually (1)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-1">
                            <span>Loan Start Date</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="w-4 h-4 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Date when the loan becomes active</p>
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="firstPaymentDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-1">
                            <span>First Payment Date</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="w-4 h-4 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Date of the first scheduled payment</p>
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rateTermMaturityDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-1">
                            <span>Rate Term Maturity Date</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="w-4 h-4 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Date when the current rate term expires</p>
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <div>
                      <h4 className="text-md font-medium text-gray-700 mb-4">Advanced Options</h4>
                      
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="compoundingFrequency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Compounding Frequency</FormLabel>
                              <Select value={field.value?.toString()} onValueChange={(value) => field.onChange(Number(value))}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select compounding frequency" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="2">Semi-Annually</SelectItem>
                                  <SelectItem value="12">Monthly</SelectItem>
                                  <SelectItem value="1">Annually</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="paymentType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Payment Type</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select payment type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="end">End of Period</SelectItem>
                                  <SelectItem value="beginning">Beginning of Period</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={isCalculating}
                    >
                      <Calculator className="w-4 h-4 mr-2" />
                      {isCalculating ? "Calculating..." : "Calculate Loan"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Loan Summary */}
            {summary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ChartLine className="w-5 h-5 text-green-600" />
                    <span>Loan Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-600 mb-1">Monthly Payment</div>
                      <div className="text-2xl font-bold text-blue-600">{formatCurrency(summary.monthlyPayment)}</div>
                      <div className="text-xs text-gray-500 mt-1">Principal + Interest</div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-600 mb-1">Total Interest</div>
                      <div className="text-2xl font-bold text-orange-600">{formatCurrency(summary.totalInterest)}</div>
                      <div className="text-xs text-gray-500 mt-1">Over loan term</div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-600 mb-1">Total Payments</div>
                      <div className="text-2xl font-bold text-gray-700">{formatCurrency(summary.totalPayments)}</div>
                      <div className="text-xs text-gray-500 mt-1">Principal + Interest</div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Rate Term Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Interest during rate term:</span>
                        <span className="font-semibold ml-2">{formatCurrency(summary.rateTermInterest)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Principal paid during rate term:</span>
                        <span className="font-semibold ml-2">{formatCurrency(summary.rateTermPrincipal)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Amortization Table */}
            {schedule.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Table className="w-5 h-5 text-blue-600" />
                      <span>Amortization Schedule</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportToCsv}
                        className="flex items-center space-x-1"
                      >
                        <Download className="w-4 h-4" />
                        <span>CSV</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportToExcel}
                        className="flex items-center space-x-1"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Excel</span>
                      </Button>
                      <Select value={tableView} onValueChange={(value: any) => setTableView(value)}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Payments</SelectItem>
                          <SelectItem value="rate-term">Rate Term Only</SelectItem>
                          <SelectItem value="year">Current Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Payment #</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Payment Date</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-700">Beginning Balance</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-700">Scheduled Payment</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-700">Principal</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-700">Interest</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-700">Ending Balance</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-700">Cumulative Interest</th>
                          <th className="px-4 py-3 text-center font-medium text-gray-700">Days</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {paginatedSchedule.map((payment) => (
                          <tr key={payment.paymentNumber} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium">{payment.paymentNumber}</td>
                            <td className="px-4 py-3">{format(payment.paymentDate, 'yyyy-MM-dd')}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(payment.beginningBalance)}</td>
                            <td className="px-4 py-3 text-right font-medium">{formatCurrency(payment.scheduledPayment)}</td>
                            <td className="px-4 py-3 text-right text-green-600">{formatCurrency(payment.principalPayment)}</td>
                            <td className="px-4 py-3 text-right text-orange-600">{formatCurrency(payment.interestPayment)}</td>
                            <td className="px-4 py-3 text-right font-medium">{formatCurrency(payment.endingBalance)}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(payment.cumulativeInterest)}</td>
                            <td className="px-4 py-3 text-center">{payment.daysBetweenPayments}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Showing payments {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredSchedule.length)} of {filteredSchedule.length} ({tableView === 'rate-term' ? 'Rate Term' : tableView === 'year' ? 'Current Year' : 'All'})
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md">
                          {currentPage}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Payment Adjustment Note */}
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-start space-x-2">
                  <Calendar className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-1">Payment Date Adjustments</h4>
                    <p className="text-sm text-yellow-700">
                      When a scheduled payment date falls on a weekend or Canadian statutory holiday, 
                      the payment date is automatically adjusted to the next business day. This is reflected 
                      in the amortization schedule above and affects the number of days between payments.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Important Disclaimer</h4>
              <p className="text-sm text-gray-600">
                This calculator provides estimates for illustrative purposes only. 
                Actual loan terms and payments may vary based on credit assessment, 
                market conditions, and bank policies.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Features</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Canadian business day calculations</li>
                <li>• Statutory holiday adjustments</li>
                <li>• Detailed amortization schedules</li>
                <li>• Multiple payment frequencies</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Contact</h4>
              <p className="text-sm text-gray-600">
                For personalized loan quotes and professional advice, 
                contact our commercial lending specialists.
              </p>
              <div className="mt-2">
                <span className="text-sm font-medium text-blue-600">1-800-BANK-LOAN</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
