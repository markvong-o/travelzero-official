import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import api from '../api.js';

function BucketProgress({ label, bucket, tint }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <span className="text-xs text-muted-foreground">
          {bucket.percentage}% of total signups
        </span>
      </div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">Completion Rate</span>
        <span className="text-2xl font-bold text-foreground">{bucket.completionRate}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${tint}`}
          style={{ width: `${bucket.completionRate}%` }}
        />
      </div>
    </div>
  );
}

// Anonymous users never reach this page — AppLayout redirects to /login
// before this component mounts.
export default function ExperimentCenter() {
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await api.getPasskeyTestStats();
        setStats(data);
      } catch (error) {
        showToast('Failed to load experiment data', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [showToast]);

  if (loading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading experiment data…</div>;
  }

  if (!stats) {
    return <div className="p-8 text-sm text-destructive">Failed to load experiment data</div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6 lg:p-10">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Experiment Center
        </h1>
        <Badge>Internal / Admin View</Badge>
      </header>

      <p className="text-sm leading-relaxed text-muted-foreground">
        Conceptual preview — Auth0 doesn&apos;t currently ship a dashboard product named
        &ldquo;Experiment Center.&rdquo; What&apos;s shown below is real-time data computed from
        actual signup events, in a shape you could build today with an Auth0 Action that tags each
        signup with an experiment bucket, paired with your own analytics.
      </p>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">{stats.experimentName}</CardTitle>
            <p className="font-mono text-xs text-muted-foreground">{stats.experimentId}</p>
          </div>
          <Badge variant={stats.status === 'active' ? 'default' : 'outline'}>{stats.status}</Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-muted px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Total Signups
              </p>
              <p className="text-2xl font-bold text-foreground">{stats.totalSignups}</p>
            </div>
            <div className="rounded-lg bg-muted px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Winner</p>
              <p className="text-2xl font-bold text-accent">{stats.winner?.toUpperCase()}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <BucketProgress label="Passkey" bucket={stats.buckets.passkey} tint="bg-primary" />
            <BucketProgress label="Password" bucket={stats.buckets.password} tint="bg-accent" />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bucket</TableHead>
                <TableHead className="text-right">Started</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Completion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {['passkey', 'password'].map((key) => (
                <TableRow key={key}>
                  <TableCell className="font-medium capitalize">{key}</TableCell>
                  <TableCell className="text-right">{stats.buckets[key].totalStarted}</TableCell>
                  <TableCell className="text-right">
                    {stats.buckets[key].totalCompleted}
                  </TableCell>
                  <TableCell className="text-right">
                    {stats.buckets[key].completionRate}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">Insights</h3>
            <ul className="flex list-inside list-disc flex-col gap-1 text-sm text-muted-foreground">
              {stats.insights.map((insight) => (
                <li key={insight}>{insight}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Methodology</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            This experiment compares signup completion rates between passkey and password
            authentication methods. Signups are randomly assigned to buckets, and real data is
            collected from actual user registrations.
          </p>
          <p>
            The passkey method simulates WebAuthn ceremony with a 1.2-second delay to approximate
            real biometric authentication timing. Both methods create user accounts and assign
            loyalty points.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
