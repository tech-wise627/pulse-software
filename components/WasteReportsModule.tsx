'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Download, RefreshCw, AlertCircle, CheckCircle, Activity, Zap, FileText, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockWasteByHour, mockWorkerPerformance, mockWasteComposition, mockZoneData, mockEventSummary, mockPredictions, mockLocations } from '@/lib/mock-data';

export default function WasteReportsModule() {
  const [selectedEvent, setSelectedEvent] = useState('event-001');
  const [selectedLocation, setSelectedLocation] = useState('loc-001');
  const [timeRange, setTimeRange] = useState('past-month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  return (
    <div className="space-y-6">
      {/* Filters Panel */}
      <Card className="border-primary/20 bg-card">
        <CardHeader>
          <CardTitle className="text-accent">Filters & Analytics</CardTitle>
          <CardDescription>Customize your report view with filters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Event Name</label>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger className="bg-input border-primary/20">
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary/20">
                  <SelectItem value="event-001">Central Business District Cleanup 2026</SelectItem>
                  <SelectItem value="event-002">Somaiya Fest 2026</SelectItem>
                  <SelectItem value="event-003">Beach Cleanup Drive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Location</label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="bg-input border-primary/20">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary/20">
                  <SelectItem value="loc-001">Mumbai, Maharashtra</SelectItem>
                  <SelectItem value="loc-002">Bangalore, Karnataka</SelectItem>
                  <SelectItem value="loc-003">Delhi, NCR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Time Range</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="bg-input border-primary/20">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary/20">
                  <SelectItem value="past-week">Past Week</SelectItem>
                  <SelectItem value="past-month">Past Month</SelectItem>
                  <SelectItem value="past-year">Past Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {timeRange === 'custom' && (
              <div className="col-span-full flex gap-2">
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground mb-2 block">Start Date</label>
                  <input 
                    type="date" 
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-input border border-primary/20 rounded text-foreground"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground mb-2 block">End Date</label>
                  <input 
                    type="date" 
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-input border border-primary/20 rounded text-foreground"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Event Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bins Deployed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{mockEventSummary.bins_deployed}</div>
            <p className="text-xs text-muted-foreground mt-1">vs 28 Recommended</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Workers Deployed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{mockEventSummary.workers_active}</div>
            <p className="text-xs text-muted-foreground mt-1">vs 10 Recommended</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-primary/10 border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cleaning Cycles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{mockEventSummary.cleaning_cycles_completed}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-primary/10 border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">System Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">{mockEventSummary.collection_efficiency}%</div>
            <p className="text-xs text-muted-foreground mt-1">Optimal Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Event Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Bin Status */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-accent">Current Bin Status Distribution</CardTitle>
            <CardDescription>Real-time bin fill levels across zones</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie 
                  data={[
                    { name: 'Green (0-50%)', value: 35, fill: '#22c55e' },
                    { name: 'Yellow (50-80%)', value: 40, fill: '#eab308' },
                    { name: 'Red (80-100%)', value: 20, fill: '#ef4444' },
                    { name: 'Offline', value: 5, fill: '#666' }
                  ]}
                  cx="50%" cy="50%" labelLine={false} label={(entry) => `${entry.name}: ${entry.value}%`} outerRadius={80} dataKey="value"
                >
                  {[
                    { fill: '#22c55e' },
                    { fill: '#eab308' },
                    { fill: '#ef4444' },
                    { fill: '#666' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #00FF9C' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Active Alerts */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-accent">Active Alerts & Issues</CardTitle>
            <CardDescription>Critical operational alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Zone North Wing - High Waste Accumulation</p>
                <p className="text-xs text-muted-foreground">3 bins at 95%+ capacity</p>
              </div>
            </div>
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Worker Response Time - Extended</p>
                <p className="text-xs text-muted-foreground">Avg 35 min vs target 25 min</p>
              </div>
            </div>
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">All IoT Devices Connected</p>
                <p className="text-xs text-muted-foreground">100% system uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historical Event Analytics */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-accent">Historical Event Comparison</CardTitle>
          <CardDescription>Waste generation trends across past events</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={[
              { event: 'Somaiya 2024', waste: 1450, required: 1500, workers: 8, efficiency: 88 },
              { event: 'Somaiya 2025', waste: 1680, required: 1680, workers: 8, efficiency: 90 },
              { event: 'Somaiya 2026', waste: 1850, required: 1900, workers: 10, efficiency: 91 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="event" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #00FF9C' }} />
              <Legend />
              <Line type="monotone" dataKey="waste" stroke="#00FF9C" strokeWidth={2} name="Waste Collected (kg)" />
              <Line type="monotone" dataKey="required" stroke="#FF6B9D" strokeWidth={2} name="Waste Required (kg)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-accent">Waste Collection Timeline</CardTitle>
          <CardDescription>Hourly waste collection vs AI predictions</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockWasteByHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="hour" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #00FF9C' }} />
              <Legend />
              <Line type="monotone" dataKey="collected" stroke="#00FF9C" strokeWidth={2} name="Collected (kg)" />
              <Line type="monotone" dataKey="predicted" stroke="#FF6B9D" strokeWidth={2} strokeDasharray="5 5" name="Predicted (kg)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Zone-wise Waste Distribution & Worker Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zone Data */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-accent">Zone-wise Waste Distribution</CardTitle>
            <CardDescription>Waste collected by zone</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={mockZoneData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="zone" stroke="#999" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#999" />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #00FF9C' }} />
                <Bar dataKey="waste" fill="#00FF9C" name="Waste (kg)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Worker Performance */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-accent">Worker Performance</CardTitle>
            <CardDescription>Collections completed vs efficiency</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={mockWorkerPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#999" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#999" />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #00FF9C' }} />
                <Bar dataKey="collections" fill="#4ECDC4" name="Collections" />
                <Bar dataKey="efficiency" fill="#00FF9C" name="Efficiency %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Waste Composition & Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waste Composition */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-accent">Waste Composition Analysis</CardTitle>
            <CardDescription>Waste breakdown by material type</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={mockWasteComposition} cx="50%" cy="50%" labelLine={false} label={(entry) => `${entry.name} ${entry.value}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {mockWasteComposition.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #00FF9C' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Predictive Insights */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-accent">P.U.L.S.E Predictive Insights</CardTitle>
            <CardDescription>AI-powered recommendations for future events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockPredictions.map((prediction, idx) => (
              <div key={idx} className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground text-sm">{prediction.metric}</p>
                    <p className="text-2xl font-bold text-accent">{prediction.predicted} {prediction.unit}</p>
                  </div>
                  <Badge variant="outline" className="border-green-500 text-green-500 bg-green-500/10">
                    {prediction.confidence}% confidence
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Waste Heatmap & Zones */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-accent flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Waste Hotspot Heatmap by Zone
          </CardTitle>
          <CardDescription>Identify high-waste areas requiring additional resources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {mockZoneData.map((zone, idx) => {
              let heatColor = 'from-green-500';
              let intensityLabel = 'Low';
              if (zone.waste > 350) {
                heatColor = 'from-red-500';
                intensityLabel = 'High';
              } else if (zone.waste > 300) {
                heatColor = 'from-yellow-500';
                intensityLabel = 'Medium';
              }
              return (
                <div key={idx} className={`p-4 rounded-lg bg-gradient-to-br ${heatColor}/20 border border-primary/20 hover:border-primary/40 transition-colors`}>
                  <p className="text-sm font-bold text-foreground mb-1">{zone.zone}</p>
                  <div className="space-y-1 text-xs">
                    <p><span className="text-accent font-bold">{intensityLabel}</span> intensity</p>
                    <p><span className="text-primary font-bold">{zone.waste}</span> kg waste</p>
                    <p><span className="text-green-500 font-bold">{zone.efficiency}%</span> efficiency</p>
                    <p>Bins: <span className="font-bold">{zone.bins}</span> | Workers: <span className="font-bold">{zone.workers}</span></p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-accent flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Zone Efficiency Heatmap
          </CardTitle>
          <CardDescription>Real-time zone performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {mockZoneData.map((zone, idx) => {
              const heatColor = zone.efficiency >= 92 ? 'from-green-500' : zone.efficiency >= 88 ? 'from-yellow-500' : 'from-orange-500';
              return (
                <div key={idx} className={`p-4 rounded-lg bg-gradient-to-br ${heatColor}/20 border border-primary/20`}>
                  <p className="text-sm font-medium text-foreground mb-2">{zone.zone}</p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p><span className="text-accent font-bold">{zone.efficiency}%</span> efficiency</p>
                    <p><span className="text-primary font-bold">{zone.bins}</span> bins</p>
                    <p><span className="text-green-500 font-bold">{zone.workers}</span> workers</p>
                    <p><span className="text-blue-500 font-bold">{zone.waste}</span> kg waste</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Report Export Section */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="text-accent flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Export & Generate Reports
          </CardTitle>
          <CardDescription>Generate comprehensive reports for stakeholders and partner brands</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Report Formats:</p>
              <div className="flex flex-wrap gap-2">
                <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                  <Download className="w-4 h-4" />
                  PDF Report
                </Button>
                <Button variant="outline" className="border-primary/20 gap-2">
                  <Download className="w-4 h-4" />
                  CSV Export
                </Button>
                <Button variant="outline" className="border-primary/20 gap-2">
                  <Download className="w-4 h-4" />
                  Excel Export
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Quick Actions:</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="border-primary/20 gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Refresh Data
                </Button>
                <Button variant="outline" className="border-primary/20 gap-2">
                  <TrendingUp className="w-4 h-4" />
                  View Detailed Trends
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-xs text-muted-foreground">
              Reports include event summary, waste statistics, zone analysis, worker performance, heatmaps, and operational insights for stakeholder communication.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
