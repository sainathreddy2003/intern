import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid } from '@mui/material';
import { useQuery } from 'react-query';
import { reportsAPI } from '../services/api';

const money = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const TaxCalculator = ({ title = "Tax Analysis", showDetails = false }) => {
  const { data: taxData, isLoading } = useQuery(
    'tax-calculator',
    () => reportsAPI.getTaxReport({}),
    { staleTime: 5 * 60 * 1000 } // Cache for 5 minutes
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6">{title}</Typography>
          <Typography>Loading tax data...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (!taxData?.data) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6">{title}</Typography>
          <Typography color="text.secondary">No tax data available</Typography>
        </CardContent>
      </Card>
    );
  }

  const outputTax = taxData.data.summary?.output_tax || 0;
  const netTaxPayable = taxData.data.summary?.net_tax_payable || 0;
  const taxableSales = taxData.data.summary?.taxable_sales || 0;
  const effectiveTaxRate = taxableSales > 0 ? (outputTax / taxableSales) * 100 : 0;
  const inputTaxCredit = outputTax - netTaxPayable;
  const taxCollectionEfficiency = outputTax > 0 ? ((outputTax - netTaxPayable) / outputTax * 100) : 0;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" color="primary" gutterBottom>Tax Metrics</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Effective Tax Rate:</strong> {effectiveTaxRate.toFixed(2)}%
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Tax as % of Sales:</strong> {taxableSales > 0 ? (netTaxPayable / taxableSales * 100).toFixed(2) : 0}%
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Tax Burden:</strong> 
              <span style={{ 
                color: effectiveTaxRate > 10 ? 'red' : effectiveTaxRate > 5 ? 'orange' : 'green' 
              }}>
                {' '}{effectiveTaxRate > 10 ? 'High' : effectiveTaxRate > 5 ? 'Moderate' : 'Optimal'}
              </span>
            </Typography>
            <Typography variant="body2">
              <strong>Input Tax Credit:</strong> {money(inputTaxCredit)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" color="secondary" gutterBottom>Compliance Indicators</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Tax Collection Efficiency:</strong> {taxCollectionEfficiency.toFixed(1)}% credit utilization
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Monthly Tax Liability:</strong> {money(netTaxPayable)}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Tax Compliance:</strong> 
              <span style={{ 
                color: effectiveTaxRate <= 10 ? 'green' : effectiveTaxRate <= 15 ? 'orange' : 'red' 
              }}>
                {' '}{effectiveTaxRate <= 10 ? 'On Track' : effectiveTaxRate <= 15 ? 'Review Needed' : 'Action Required'}
              </span>
            </Typography>
            <Typography variant="body2">
              <strong>Filing Status:</strong> Current Period
            </Typography>
          </Grid>
        </Grid>

        {showDetails && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>Detailed Breakdown</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption">Output Tax:</Typography>
                <Typography variant="body2">{money(outputTax)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption">Net Tax Payable:</Typography>
                <Typography variant="body2">{money(netTaxPayable)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption">Taxable Sales:</Typography>
                <Typography variant="body2">{money(taxableSales)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption">Credit Utilized:</Typography>
                <Typography variant="body2">{money(inputTaxCredit)}</Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TaxCalculator;
