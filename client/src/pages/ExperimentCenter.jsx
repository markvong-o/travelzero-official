import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, CheckCircle2, PauseCircle, ArrowRight, Zap, Radio, LayoutTemplate, Fingerprint, KeyRound, RefreshCw, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useExperimentContext } from '../context/ExperimentContext';
import { useAuth } from '../context/AuthContext';
import { Metric } from '../components/Metric';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { isAuth0Configured } from '../lib/auth-config';
import api from '../api.js';
import s from './ExperimentCenter.module.css';

// Auth0 experiment IDs for the live tenant (idzero.cic-demo-platform.auth0app.com)
const AUTH0_EXPERIMENT_IDS = {
  exp_passkey_enrollment:  'exp_wPe1df6nVSsqtNvxAUkr7P',
  exp_device_segmentation: 'exp_uMP2ccYnKbSXPPNF8q1jsh',
};

const EXPERIMENTS = [
  {
    id: 'exp_passkey_enrollment',
    auth0Id: AUTH0_EXPERIMENT_IDS.exp_passkey_enrollment,
    name: 'Passkey Broad Rollout',
    flow: 'post-login:passkey',
    status: 'active',
    split: [10, 90],
    primaryMetric: 'Passkey enrollment take-rate',
    significant: false,
    auth0Wired: true,
    previewPath: '/dashboard',
    control: {
      label: 'No enrollment nudge',
      description: 'Login proceeds directly to the Dashboard. Passkeys are available but not surfaced — baseline adoption measured here.',
      value: '2.1%',
    },
    treatment: {
      label: 'Enrollment nudge card',
      description: 'A dismissable card at the top of the Dashboard invites the user to set up a passkey. 90% of traffic sees this to maximize signal.',
      value: '14.3%',
    },
  },
  {
    id: 'exp_device_segmentation',
    auth0Id: AUTH0_EXPERIMENT_IDS.exp_device_segmentation,
    name: 'Device-Segmented Auth Routing',
    flow: 'login:device',
    status: 'draft',
    split: null,
    allocationStrategy: 'segment',
    segment: 'Modern iOS Devices',
    primaryMetric: 'Auth completion rate by device cohort',
    significant: false,
    measurementOnly: true,
    auth0Wired: true,
    previewPath: '/login',
    control: {
      label: 'OTP fallback cohort',
      description: 'Devices outside the Modern iOS segment — older Android, legacy OS. Auth0 falls back to email OTP as the primary method.',
    },
    treatment: {
      label: 'Passkey-primary cohort',
      description: 'iOS 17+ devices with biometric capability. Auth0 natively surfaces passkey as the primary method based on device signals.',
    },
  },
];

const STATUS_META = {
  active:    { label: 'Active',    icon: FlaskConical,  cls: 'statusActive' },
  paused:    { label: 'Paused',    icon: PauseCircle,   cls: 'statusPaused' },
  completed: { label: 'Completed', icon: CheckCircle2,  cls: 'statusCompleted' },
};

const FLOW_LABELS = {
  'signup':               { label: 'Signup',              cls: 'flowSignup' },
  'post-login:passkey':   { label: 'Post-login · Passkey', cls: 'flowPostLogin' },
  'mfa:challenge':        { label: 'MFA · Challenge',      cls: 'flowMfa' },
  'login:device':         { label: 'Login · Device',       cls: 'flowPostLogin' },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.active;
  const Icon = meta.icon;
  return (
    <span className={cn(s.statusBadge, s[meta.cls])}>
      <Icon size={11} />
      {meta.label}
    </span>
  );
}

function FlowChip({ flow }) {
  const meta = FLOW_LABELS[flow] || { label: flow, cls: 'flowSignup' };
  return <span className={cn(s.flowChip, s[meta.cls])}>{meta.label}</span>;
}

const isAuth0Mode = isAuth0Configured();

function IdRow({ label, id, onCopy, copied }) {
  if (!id) return null;
  return (
    <div className={s.idRow}>
      <span className={s.idLabel}>{label}</span>
      <button className={s.idChip} onClick={() => onCopy(id)} title="Copy">
        <code>{id}</code>
        {copied ? <Check size={11} /> : <Copy size={11} />}
      </button>
    </div>
  );
}

// Shortens long opaque values (client IDs, etc.) for inline display in condition
// chips while keeping both ends visible enough to eyeball a match.
function truncateMid(value) {
  const str = String(value);
  return str.length > 16 ? `${str.slice(0, 6)}…${str.slice(-6)}` : str;
}

export default function ExperimentCenter() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { setVariant, getVariant } = useExperimentContext();
  const { loginWithVariant } = useAuth();

  const [selected, setSelected] = useState(null);
  const [previewVariant, setPreviewVariant] = useState('control');
  const [liveStats, setLiveStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [auth0Experiments, setAuth0Experiments] = useState([]);
  const [auth0Loading, setAuth0Loading] = useState(false);
  const [auth0Error, setAuth0Error] = useState(null);
  const [expandedExp, setExpandedExp] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (isAuth0Mode) { setLoading(false); return; }
    api.getPasskeyTestStats()
      .then(setLiveStats)
      .catch(() => showToast('Could not load live experiment data', 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  const handleSelectExperiment = (exp) => {
    setSelected(exp);
    setPreviewVariant(getVariant(exp.id));
  };

  const handlePreview = () => {
    setVariant(selected.id, previewVariant);
    navigate(selected.previewPath);
  };

  // Merge live stats into the passkey experiment display
  const getVariantValues = (exp) => {
    if (exp.realData && liveStats) {
      const ctrl = liveStats.buckets.password;
      const treat = liveStats.buckets.passkey;
      return {
        control:   { ...exp.control,   value: `${ctrl.completionRate}%`,  n: ctrl.totalStarted },
        treatment: { ...exp.treatment, value: `${treat.completionRate}%`, n: treat.totalStarted },
        significant: treat.completionRate !== ctrl.completionRate,
        winner: treat.completionRate > ctrl.completionRate ? 'treatment' : 'control',
        totalN: liveStats.totalSignups,
      };
    }
    return {
      control: exp.control,
      treatment: exp.treatment,
      significant: exp.significant,
      winner: exp.winner,
      totalN: null,
    };
  };

  const fetchAuth0Experiments = () => {
    setAuth0Loading(true);
    setAuth0Error(null);
    api.getAuth0Experiments()
      .then(data => setAuth0Experiments(data))
      .catch(err => setAuth0Error(err.error || err.message || 'Failed to load experiments'))
      .finally(() => setAuth0Loading(false));
  };

  useEffect(() => {
    if (isAuth0Mode) fetchAuth0Experiments();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const copyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const statusVariant = (status) => ({
    active: 'default',
    draft: 'outline',
    paused: 'secondary',
    completed: 'secondary',
    archived: 'secondary',
  }[status] ?? 'outline');

  const selectedData = selected ? getVariantValues(selected) : null;

  return (
    <div className={s.page}>
      <header className={s.header}>
        <h1 className={`font-display ${s.title}`}>Experiment Center</h1>
        <div className={s.headerBadges}>
          <Badge>Enterprise</Badge>
          <Badge variant="outline">Early Access</Badge>
          {isAuth0Mode && (
            <Badge variant="outline" className={s.auth0Badge}>
              <Radio size={10} />
              Auth0 Connected
            </Badge>
          )}
        </div>
      </header>

      <p className={s.intro}>
        Test changes to your authentication pipeline on real traffic, measure the impact per flow,
        and promote the winner with confidence — without building a separate analytics stack.
        One active experiment per flow; results update on a batch cadence.
      </p>

      {/* ── Experiment list — mock mode only. In real Auth0 mode this hardcoded
          list would silently drift from the tenant's actual state (it did:
          before activating exp_device_segmentation, this array still claimed
          it was "draft" and exp_passkey_enrollment was "active" — the reverse
          of reality). The live panel below is the source of truth instead. ── */}
      {!isAuth0Mode && (
      <Card variant="raised">
        <CardHeader>
          <CardTitle>Active Experiments</CardTitle>
        </CardHeader>
        <CardContent className={s.tableWrap}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Experiment</TableHead>
                <TableHead>Flow</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className={s.right}>Split</TableHead>
                <TableHead className={s.right}>Primary metric</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {EXPERIMENTS.map((exp) => {
                const vals = getVariantValues(exp);
                const isSelected = selected?.id === exp.id;
                return (
                  <TableRow
                    key={exp.id}
                    className={cn(s.experimentRow, isSelected && s.experimentRowSelected)}
                    onClick={() => handleSelectExperiment(exp)}
                  >
                    <TableCell>
                      <span className={s.expName}>{exp.name}</span>
                      {exp.winner && (
                        <span className={s.winnerTag}>
                          <Zap size={10} /> {exp.winner === 'treatment' ? vals.treatment.label : vals.control.label} wins
                        </span>
                      )}
                    </TableCell>
                    <TableCell><FlowChip flow={exp.flow} /></TableCell>
                    <TableCell><StatusBadge status={exp.status} /></TableCell>
                    <TableCell className={s.right}>
                      {exp.split
                        ? <span className={s.split}>{exp.split[0]} / {exp.split[1]}</span>
                        : <span className={s.split}>Segment</span>
                      }
                    </TableCell>
                    <TableCell className={s.right}>
                      <span className={s.metricLabel}>{exp.primaryMetric}</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      )}

      {/* ── Detail view (mock mode only, see note above) ── */}
      {!isAuth0Mode && selected && selectedData && (
        <Card>
          <CardHeader className={s.detailHeader}>
            <div>
              <CardTitle>{selected.name}</CardTitle>
              <div className={s.detailMeta}>
                <FlowChip flow={selected.flow} />
                <StatusBadge status={selected.status} />
                {selected.split ? (
                  <span className={s.splitLabel}>
                    {selected.split[0]}% control · {selected.split[1]}% treatment
                  </span>
                ) : (
                  <span className={s.splitLabel}>
                    Segment-based · {selected.segment}
                  </span>
                )}
                {selectedData.totalN != null && (
                  <span className={s.splitLabel}>{selectedData.totalN} total signups</span>
                )}
              </div>
            </div>
            {selectedData.significant != null && (
              <span className={cn(s.sigChip, selectedData.significant ? s.sigChipYes : s.sigChipNo)}>
                {selectedData.significant ? '✓ Statistically significant' : '⏳ Not yet significant'}
              </span>
            )}
          </CardHeader>

          <CardContent className={s.detailBody}>
            {/* ── Auth0 mode assignment banner ── */}
            {isAuth0Mode && (
              selected.auth0Wired ? (
                <div className={s.assignmentBanner}>
                  <Radio size={13} className={s.assignmentBannerIcon} />
                  <div>
                    <span className={s.assignmentBannerTitle}>Auth0-assigned</span>
                    <span className={s.assignmentBannerText}>
                      Variant is deterministically assigned by your Auth0 tenant's Experiment Center.
                      Current session is in the <strong>{getVariant(selected.id)}</strong> variant.
                      Use Preview to force a different variant for this demo session — Auth0 will reassign on next login.
                    </span>
                  </div>
                </div>
              ) : (
                <div className={s.aculBanner}>
                  <LayoutTemplate size={13} className={s.aculBannerIcon} />
                  <div>
                    <span className={s.aculBannerTitle}>Universal Login / ACUL scope</span>
                    <span className={s.aculBannerText}>
                      This experiment targets the pre-authentication signup flow. In production,
                      wire it via Auth0's Advanced Custom UI Library (ACUL) to branch the login page
                      itself. In mock mode, the Preview button drives the variant directly.
                    </span>
                  </div>
                </div>
              )
            )}

            {/* ── Variant comparison cards ── */}
            <div className={s.variantGrid}>
              {['control', 'treatment'].map((v) => {
                const vd = selectedData[v];
                const isActive = previewVariant === v;
                const isWinner = selectedData.winner === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setPreviewVariant(v)}
                    className={cn(s.variantCard, isActive && s.variantCardActive)}
                  >
                    <div className={s.variantCardTop}>
                      <div>
                        <span className={s.variantRole}>{v === 'control' ? 'Control' : 'Treatment'}</span>
                        <p className={s.variantLabel}>{vd.label}</p>
                      </div>
                      <div className={s.variantRight}>
                        {vd.value && (
                          <span className={cn(s.variantValue, isWinner && s.variantValueWinner)}>
                            {vd.value}
                          </span>
                        )}
                        {isWinner && <span className={s.winnerBadge}><Zap size={10} /> Winner</span>}
                      </div>
                    </div>
                    <p className={s.variantDesc}>{vd.description}</p>
                    {vd.n != null && (
                      <p className={s.variantN}>n = {vd.n}</p>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── Preview action ── */}
            <div className={s.previewRow}>
              <p className={s.previewHint}>
                Previewing: <strong>{previewVariant}</strong> variant.{' '}
                {isAuth0Mode && selected.auth0Wired
                  ? selected.measurementOnly
                    ? 'Measurement experiment — cohort is determined at login by Auth0 device signals. Preview shows current session state.'
                    : 'Overrides Auth0 assignment for this session. Auth0 reassigns on next login.'
                  : 'This will update the live UI for your session.'}
              </p>
              <Button variant="brand" onClick={handlePreview}>
                Preview in app <ArrowRight size={15} />
              </Button>
            </div>

            {/* ── Metric bars (for experiments with mock/live data) ── */}
            {(selectedData.control.value || selectedData.treatment.value) && (
              <div className={s.metricBars}>
                {['control', 'treatment'].map((v) => {
                  const vd = selectedData[v];
                  const pct = parseFloat(vd.value) || 0;
                  const isWinner = selectedData.winner === v;
                  return (
                    <div key={v} className={s.metricBar}>
                      <div className={s.metricBarTop}>
                        <span>{v === 'control' ? 'Control' : 'Treatment'}</span>
                        <span className={cn(s.metricBarVal, isWinner && s.metricBarValWinner)}>{vd.value}</span>
                      </div>
                      <div className={s.track}>
                        <div
                          className={cn(s.fill, isWinner ? s.fillGradient : s.fillAccent)}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!isAuth0Mode && !selected && (
        <p className={s.selectHint}>Select an experiment above to view variant details and preview it in the app.</p>
      )}

      {isAuth0Mode && (
        <Card className={s.liveCard}>
          <CardHeader className={s.liveHeader}>
            <div className={s.liveHeaderLeft}>
              <Radio size={15} className={s.liveIcon} />
              <CardTitle className={s.liveTitle}>Live from Auth0 Experiment Center</CardTitle>
              {!auth0Loading && auth0Experiments.length > 0 && (
                <Badge variant="outline">{auth0Experiments.length} experiment{auth0Experiments.length !== 1 ? 's' : ''}</Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={fetchAuth0Experiments} disabled={auth0Loading} className={s.refreshBtn}>
              <RefreshCw size={13} className={auth0Loading ? s.spinning : ''} />
              {auth0Loading ? 'Loading…' : 'Refresh'}
            </Button>
          </CardHeader>
          <CardContent className={s.liveBody}>
            {auth0Error && (
              <p className={s.liveError}>{auth0Error}</p>
            )}
            {!auth0Loading && !auth0Error && auth0Experiments.length === 0 && (
              <p className={s.liveEmpty}>No experiments found on this tenant.</p>
            )}
            {auth0Experiments.map(exp => {
              const isOpen = expandedExp === exp.id;
              const variations = exp.feature_flag?.variations ?? [];
              return (
                <div key={exp.id} className={s.expRow}>
                  <button
                    className={s.expRowHeader}
                    onClick={() => setExpandedExp(isOpen ? null : exp.id)}
                  >
                    <span className={s.expChevron}>
                      {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                    <span className={s.expName}>{exp.name}</span>
                    <Badge variant={statusVariant(exp.status)} className={s.expStatus}>{exp.status}</Badge>
                    {!exp.is_valid && <Badge variant="outline" className={s.invalidBadge}>invalid</Badge>}
                    <span className={s.expFlow}>{exp.authentication_flow}</span>
                  </button>

                  {isOpen && (
                    <div className={s.expDetail}>
                      <div className={s.idGrid}>
                        <IdRow label="Experiment ID" id={exp.id} onCopy={copyId} copied={copiedId === exp.id} />
                        <IdRow label="Feature flag" id={exp.feature_flag_id} onCopy={copyId} copied={copiedId === exp.feature_flag_id} />
                        <div className={s.metaRow}>
                          <span className={s.metaLabel}>Strategy</span>
                          <span className={s.metaValue}>{exp.allocation_strategy ?? '—'}</span>
                          <span className={s.metaLabel}>Subject</span>
                          <span className={s.metaValue}>{exp.assignment_config?.subject ?? '—'}</span>
                        </div>
                      </div>

                      <div className={s.allocSection}>
                        <p className={s.allocTitle}>Allocations</p>
                        <table className={s.allocTable}>
                          <thead>
                            <tr>
                              <th>Variation ID</th>
                              <th>Role</th>
                              <th>Segment</th>
                              {variations.length > 0 && <th>Name</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {exp.allocations?.map(alloc => {
                              const variation = variations.find(v => v.id === alloc.variation_id);
                              return (
                                <tr key={alloc.variation_id} className={alloc.is_control ? s.controlRow : ''}>
                                  <td>
                                    <button className={s.idChip} onClick={() => copyId(alloc.variation_id)} title="Copy">
                                      <code>{alloc.variation_id}</code>
                                      {copiedId === alloc.variation_id ? <Check size={11} /> : <Copy size={11} />}
                                    </button>
                                  </td>
                                  <td className={s.roleCell}>
                                    {alloc.is_control && <Badge variant="secondary">control</Badge>}
                                    {alloc.is_fallback && <Badge variant="outline">fallback</Badge>}
                                    {!alloc.is_control && !alloc.is_fallback && <Badge variant="default">treatment</Badge>}
                                  </td>
                                  <td>
                                    {alloc.segment
                                      ? <div className={s.conditionChips}>
                                          {Object.entries(alloc.segment.rules?.[0]?.match ?? {}).map(([field, values]) => (
                                            <span key={field} className={s.conditionChip}>
                                              <span className={s.conditionField}>{field}</span>
                                              <span className={s.conditionValues}>
                                                {(Array.isArray(values) ? values : [values]).map(truncateMid).join(', ')}
                                              </span>
                                            </span>
                                          ))}
                                        </div>
                                      : alloc.segment_id
                                        ? <button className={s.idChip} onClick={() => copyId(alloc.segment_id)} title="Copy segment ID">
                                            <code>{alloc.segment_id}</code>
                                            {copiedId === alloc.segment_id ? <Check size={11} /> : <Copy size={11} />}
                                          </button>
                                        : <span className={s.fallbackLabel}>fallback (all)</span>}
                                  </td>
                                  {variations.length > 0 && <td className={s.varName}>{variation?.name ?? '—'}</td>}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {variations.length > 0 && (
                        <div className={s.allocSection}>
                          <p className={s.allocTitle}>Feature flag parameters</p>
                          <table className={s.allocTable}>
                            <thead>
                              <tr><th>Parameter</th><th>Type</th><th>Baseline</th></tr>
                            </thead>
                            <tbody>
                              {exp.feature_flag?.parameters?.map(param => (
                                <tr key={param.name}>
                                  <td><code>{param.name}</code></td>
                                  <td>{param.type}</td>
                                  <td><code>{JSON.stringify(param.default_value)}</code></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {exp.id === AUTH0_EXPERIMENT_IDS.exp_device_segmentation && (
                        <div className={s.demoRow}>
                          <p className={s.demoHint}>
                            Demo in Universal Login — forces a variant at the Auth0 login screen. Requires ACUL screens to be deployed.
                          </p>
                          <div className={s.demoBtns}>
                            <Button variant="outline" size="sm" onClick={() => loginWithVariant('passkey')}>
                              <Fingerprint size={14} /> Demo passkey-first
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => loginWithVariant('password')}>
                              <KeyRound size={14} /> Demo password-first
                            </Button>
                          </div>
                        </div>
                      )}

                      <p className={s.expTimestamp}>
                        Created {new Date(exp.created_at).toLocaleDateString()} ·
                        Updated {new Date(exp.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
