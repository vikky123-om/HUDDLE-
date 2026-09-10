"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Lock } from "lucide-react";

const COLORS = ["#8f5b2f", "#a87c3d", "#c29552", "#d4a574", "#e5b896"];

export function AdminDashboard() {
  const analytics = useQuery(api.admin.getAnalytics);
  const auditLog = useQuery(api.admin.getAuditLog, { limit: 20 });

  if (!analytics) {
    return (
      <div className="p-8 text-center">
        <Lock className="h-8 w-8 mx-auto mb-2 text-amber-900/30" />
        <p className="text-amber-900/50">Admin access required</p>
      </div>
    );
  }

  const chartData = [
    { name: "Total Huddles", value: analytics.totalActivities },
    { name: "Total Members", value: analytics.totalMembers },
    { name: "Total Messages", value: analytics.totalMessages },
  ];

  return (
    <div className="min-h-screen bg-paper p-8">
      <h1 className="font-display text-3xl font-bold text-amber-950 mb-8">
        Admin Dashboard
      </h1>

      {/* Metrics Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg border border-amber-900/15 bg-white p-6">
          <p className="text-sm text-ink/60 font-semibold">Total Huddles</p>
          <p className="text-3xl font-bold text-amber-950">
            {analytics.totalActivities}
          </p>
        </div>
        <div className="rounded-lg border border-amber-900/15 bg-white p-6">
          <p className="text-sm text-ink/60 font-semibold">Total Members</p>
          <p className="text-3xl font-bold text-amber-950">
            {analytics.totalMembers}
          </p>
        </div>
        <div className="rounded-lg border border-amber-900/15 bg-white p-6">
          <p className="text-sm text-ink/60 font-semibold">Total Messages</p>
          <p className="text-3xl font-bold text-amber-950">
            {analytics.totalMessages}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="rounded-lg border border-amber-900/15 bg-white p-6">
          <h2 className="font-semibold text-amber-950 mb-4">Platform Stats</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8f5b2f" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-amber-900/15 bg-white p-6">
          <h2 className="font-semibold text-amber-950 mb-4">Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8f5b2f"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Audit Log */}
      <div className="rounded-lg border border-amber-900/15 bg-white p-6">
        <h2 className="font-semibold text-amber-950 mb-4">Recent Activity Log</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {auditLog && auditLog.length > 0 ? (
            auditLog.map((log) => (
              <div
                key={log._id}
                className="flex items-start justify-between p-3 rounded border border-amber-900/10 hover:bg-amber-50"
              >
                <div>
                  <p className="text-sm font-semibold text-amber-950">
                    {log.action}
                  </p>
                  <p className="text-xs text-ink/50">
                    {log.targetType} {log.targetId && `(${log.targetId.slice(0, 8)})`}
                  </p>
                </div>
                <p className="text-xs text-ink/40">
                  {new Date(log.timestamp).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-ink/50 text-center py-4">No activity yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
