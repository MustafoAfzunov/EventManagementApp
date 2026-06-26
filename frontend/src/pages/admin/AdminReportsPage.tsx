import { useState, useEffect } from 'react';
import {
  adminReports,
  type EventAnalytics, type RegistrationReport, type AttendanceReport, type SeatOccupancyReport,
} from '../../lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import StatusBadge from '../../components/ui/StatusBadge';
import { c } from '../../lib/theme';

const PIE_COLORS = [c.primary, '#166534'];

function shorten(title: string, n = 16) {
  return title.length > n ? title.slice(0, n) + '…' : title;
}

export default function AdminReportsPage() {
  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationReport | null>(null);
  const [attendance, setAttendance] = useState<AttendanceReport | null>(null);
  const [occupancy, setOccupancy] = useState<SeatOccupancyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminReports.analytics(),
      adminReports.registrations(),
      adminReports.attendance(),
      adminReports.seatOccupancy(),
    ])
      .then(([an, reg, att, occ]) => { setAnalytics(an); setRegistrations(reg); setAttendance(att); setOccupancy(occ); })
      .catch(() => { /* leave empty */ })
      .finally(() => setLoading(false));
  }, []);

  const summaryCards = analytics ? [
    { icon: 'how_to_reg', label: 'Total Registrations', value: analytics.totalRegistrations.toLocaleString(), color: c.primary },
    { icon: 'check_circle', label: 'Checked In', value: analytics.totalCheckedIn.toLocaleString(), color: '#166534' },
    { icon: 'event', label: 'Total Events', value: analytics.totalEvents.toLocaleString(), color: c.secondary },
    { icon: 'pie_chart', label: 'Avg. Utilization', value: `${analytics.averageCapacityUtilization}%`, color: c.tertiary },
  ] : [];

  const regChart = (registrations?.rows ?? [])
    .slice()
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
    .map((r) => ({ label: shorten(r.eventTitle), Registrations: r.total }));

  const attChart = (attendance?.rows ?? [])
    .slice(0, 10)
    .map((r) => ({ label: shorten(r.eventTitle), Rate: r.attendanceRate }));

  const totalAssigned = (occupancy?.rows ?? []).reduce((s, r) => s + r.assignedSeats, 0);
  const totalAvailable = (occupancy?.rows ?? []).reduce((s, r) => s + r.availableSeats, 0);
  const occChart = (totalAssigned + totalAvailable) > 0
    ? [{ name: 'Assigned', value: totalAssigned }, { name: 'Available', value: totalAvailable }]
    : [];

  return (
    <div className="pb-12" style={{ background: c.surface, minHeight: '100vh' }}>
      <div className="max-w-[1280px] mx-auto px-6 pt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="font-semibold" style={{ fontFamily: 'Hanken Grotesk', fontSize: 32, color: c.onSurface }}>Reports & Analytics</h2>
            <p style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>Event performance, registration trends, and attendance analytics.</p>
          </div>
          <div className="flex gap-2">
            <a href={adminReports.exportUrl('registrations')} className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all" style={{ borderColor: c.outlineVariant, color: c.onSurface, fontFamily: 'Inter', textDecoration: 'none' }}>
              <span className="material-symbols-outlined text-[18px]">download</span> Registrations CSV
            </a>
            <a href={adminReports.exportUrl('attendance')} className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all" style={{ borderColor: c.outlineVariant, color: c.onSurface, fontFamily: 'Inter', textDecoration: 'none' }}>
              <span className="material-symbols-outlined text-[18px]">download</span> Attendance CSV
            </a>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          {(loading ? Array.from({ length: 4 }).map(() => null) : summaryCards).map((card, i) => (
            <div key={i} className="border rounded-xl p-6" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant }}>
              {card ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${card.color}15` }}>
                      <span className="material-symbols-outlined" style={{ color: card.color }}>{card.icon}</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-2xl mb-1" style={{ fontFamily: 'Hanken Grotesk', color: card.color }}>{card.value}</h3>
                  <p className="text-xs" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>{card.label}</p>
                </>
              ) : (
                <div className="h-20 animate-pulse rounded-lg" style={{ background: c.surfaceHigh }} />
              )}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3].map((i) => <div key={i} className="h-64 rounded-xl animate-pulse" style={{ background: c.surfaceHigh }} />)}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Registrations by event */}
            <div className="border rounded-xl p-6" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant }}>
              <h3 className="font-semibold text-xl mb-6" style={{ fontFamily: 'Hanken Grotesk', color: c.onSurface }}>Registrations by Event</h3>
              {regChart.length === 0 ? (
                <p className="text-sm py-12 text-center" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>No registration data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={regChart} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={c.outlineVariant} />
                    <XAxis dataKey="label" tick={{ fontFamily: 'Inter', fontSize: 12, fill: c.onSurfaceVariant }} />
                    <YAxis tick={{ fontFamily: 'Inter', fontSize: 12, fill: c.onSurfaceVariant }} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontFamily: 'Inter', fontSize: 12, borderRadius: 8, borderColor: c.outlineVariant }} />
                    <Bar dataKey="Registrations" fill={c.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Attendance rate */}
              <div className="border rounded-xl p-6" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant }}>
                <h3 className="font-semibold text-xl mb-6" style={{ fontFamily: 'Hanken Grotesk', color: c.onSurface }}>Attendance Rate by Event</h3>
                {attChart.length === 0 ? (
                  <p className="text-sm py-12 text-center" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>No attendance data yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={attChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke={c.outlineVariant} />
                      <XAxis dataKey="label" tick={{ fontFamily: 'Inter', fontSize: 11, fill: c.onSurfaceVariant }} />
                      <YAxis domain={[0, 100]} tick={{ fontFamily: 'Inter', fontSize: 11, fill: c.onSurfaceVariant }} />
                      <Tooltip formatter={(v) => `${v}%`} contentStyle={{ fontFamily: 'Inter', fontSize: 12, borderRadius: 8 }} />
                      <Line type="monotone" dataKey="Rate" stroke={c.secondary} strokeWidth={2} dot={{ fill: c.secondary, r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Seat occupancy */}
              <div className="border rounded-xl p-6" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant }}>
                <h3 className="font-semibold text-xl mb-6" style={{ fontFamily: 'Hanken Grotesk', color: c.onSurface }}>Seat Occupancy</h3>
                {occChart.length === 0 ? (
                  <p className="text-sm py-12 text-center" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>No seating data yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={occChart} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                        {occChart.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Legend formatter={(value) => <span style={{ fontFamily: 'Inter', fontSize: 12 }}>{value}</span>} />
                      <Tooltip contentStyle={{ fontFamily: 'Inter', fontSize: 12, borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Events table */}
            <div className="border rounded-xl overflow-hidden" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant }}>
              <div className="px-6 py-4 border-b" style={{ borderColor: c.outlineVariant }}>
                <h3 className="font-semibold text-xl" style={{ fontFamily: 'Hanken Grotesk', color: c.onSurface }}>Event Performance</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr style={{ background: `${c.surfaceLow}80` }}>
                      {['EVENT', 'STATUS', 'CONFIRMED', 'CHECKED IN', 'UTILIZATION'].map((h) => (
                        <th key={h} className="px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: c.outlineVariant }}>
                    {(analytics?.events ?? []).length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-12 text-center" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>No events yet.</td></tr>
                    ) : (analytics?.events ?? []).map((row) => (
                      <tr key={row.eventId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium" style={{ color: c.onSurface, fontFamily: 'Inter' }}>{row.eventTitle}</td>
                        <td className="px-6 py-4"><StatusBadge status={row.status} /></td>
                        <td className="px-6 py-4 text-sm font-semibold" style={{ color: c.primary, fontFamily: 'Inter' }}>{row.confirmed.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>{row.checkedIn.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full min-w-[60px]" style={{ background: c.surfaceHigh }}>
                              <div className="h-full rounded-full" style={{ background: c.primary, width: `${Math.min(100, row.capacityUtilization)}%` }} />
                            </div>
                            <span className="text-xs font-semibold" style={{ color: c.primary, fontFamily: 'Inter' }}>{row.capacityUtilization}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
