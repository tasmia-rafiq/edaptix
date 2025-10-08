"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardTitle } from "@/components/Card";
import { Book, FileText, Target, MessageSquare, TrendingUp } from "lucide-react";

interface AnalyticsData {
  totalTests: number;
  totalSubmissions: number;
  avgScore: number;
  feedbackGenerated: number;
}

export default function TeacherAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/analytics/teacher");
        const json = await res.json();

        if (!res.ok) throw new Error(json.error || "Failed to load analytics");
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[50vh] text-gray-600">
        Loading analytics...
      </div>
    );

  if (error)
    return (
      <div className="text-center text-red-600 font-medium mt-10">
        Error: {error}
      </div>
    );

  if (!data)
    return (
      <div className="text-center text-gray-600 mt-10">
        No analytics data available.
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className=" flex text-2xl gap-2 font-bold mb-6 text-gray-800">
        <TrendingUp className="w-6 h-6 text-blue-600" />Teacher Analytics Dashboard
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        <StatCard title="Total Tests" value={data.totalTests} icon={<FileText className="text-blue-500" />} color="bg-blue-50" />
        <StatCard title="Total Submissions" value={data.totalSubmissions} icon={<Book className="text-indigo-500" />}  color="bg-indigo-50" />
        <StatCard title="Average Score" value={data.avgScore} icon={<Target className="text-green-500" />} color="bg-green-50" />
        <StatCard title="Feedback Generated" value={data.feedbackGenerated} icon={<MessageSquare className="text-teal-500" />} color="bg-teal-50" />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color = "bg-gray-50",
}: {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
})


{
  return (
<Card
  className={`${color} group bg-white border border-slate-300 rounded-lg shadow-sm p-5 hover:shadow-md transition`}
>
  <CardContent className="flex flex-col items-center justify-center py-6 space-y-10">
    <div className="flex items-center gap-2">
      {icon && <div className="text-slate-600 text-2xl">{icon}</div>}
      <CardTitle className="text-xl font-semibold text-slate-800 truncate">
        {title}
      </CardTitle>
    </div>
    <p className="mt-1 text-lg text-slate-500 line-clamp-2">{value}</p>
  </CardContent>
</Card>

  );
}
