"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Symbols,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis
} from "recharts";
import type { ScatterShapeProps, TooltipContentProps, TooltipValueType } from "recharts";
import { Alert } from "../ui/alert";

export const chartPalette = {
  moss: "#0e5b50",
  graphite: "#303632",
  blue: "#2563eb",
  emerald: "#059669",
  amber: "#d97706",
  rose: "#e11d48",
  violet: "#7c3aed",
  slate: "#64748b",
  border: "#d9ddd5",
  muted: "#f1f3ef"
} as const;

export interface LineChartPoint {
  name: string;
  value: number;
  detail?: string;
}

export interface ScatterChartPoint {
  name: string;
  x: number;
  y: number;
  z?: number;
  fill?: string;
  detail?: string;
}

export interface BarChartPoint {
  name: string;
  value: number;
  detail?: string;
  fill?: string;
}

export interface StackedBarPoint {
  name: string;
  total: number;
  [key: string]: number | string;
}

export interface HeatmapPoint {
  x: string;
  y: string;
  value: number;
  fill?: string;
  detail?: string;
}

export function ThemedLineChart({
  data,
  ariaLabel,
  color = chartPalette.moss,
  valueFormatter = defaultNumberFormatter,
  height = 220
}: {
  data: LineChartPoint[];
  ariaLabel: string;
  color?: string;
  valueFormatter?: (value: number) => string;
  height?: number;
}) {
  if (data.length < 2) {
    return <ChartEmptyState>Sem pontos suficientes para renderizar a série.</ChartEmptyState>;
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={{ width: 640, height }}
      >
        <LineChart
          accessibilityLayer
          data={data}
          margin={{ top: 10, right: 12, bottom: 4, left: 0 }}
          role="img"
          aria-label={ariaLabel}
        >
          <CartesianGrid stroke={chartPalette.border} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            minTickGap={24}
            tick={{ fill: chartPalette.slate, fontSize: 12 }}
          />
          <YAxis
            width={52}
            tickLine={false}
            axisLine={false}
            tick={{ fill: chartPalette.slate, fontSize: 12 }}
            tickFormatter={(value) => compactNumber(Number(value))}
          />
          <Tooltip content={(props) => <ThemedTooltip {...props} valueFormatter={valueFormatter} />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={3}
            dot={{ r: 3, strokeWidth: 0, fill: color }}
            activeDot={{ r: 5, strokeWidth: 0, fill: color }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ThemedScatterChart({
  data,
  ariaLabel,
  xLabel,
  yLabel,
  xFormatter = defaultNumberFormatter,
  yFormatter = defaultNumberFormatter,
  height = 240
}: {
  data: ScatterChartPoint[];
  ariaLabel: string;
  xLabel: string;
  yLabel: string;
  xFormatter?: (value: number) => string;
  yFormatter?: (value: number) => string;
  height?: number;
}) {
  if (data.length === 0) {
    return <ChartEmptyState>Sem pontos para renderizar a dispersão.</ChartEmptyState>;
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={{ width: 640, height }}
      >
        <ScatterChart
          accessibilityLayer
          data={data}
          margin={{ top: 10, right: 12, bottom: 12, left: 0 }}
          role="img"
          aria-label={ariaLabel}
        >
          <CartesianGrid stroke={chartPalette.border} strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="x"
            name={xLabel}
            tickLine={false}
            axisLine={false}
            tick={{ fill: chartPalette.slate, fontSize: 12 }}
            tickFormatter={(value) => xFormatter(Number(value))}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={yLabel}
            width={52}
            tickLine={false}
            axisLine={false}
            tick={{ fill: chartPalette.slate, fontSize: 12 }}
            tickFormatter={(value) => yFormatter(Number(value))}
          />
          <ZAxis type="number" dataKey="z" range={[70, 180]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3", stroke: chartPalette.slate }}
            content={(props) => (
              <ScatterTooltip
                {...props}
                xLabel={xLabel}
                yLabel={yLabel}
                xFormatter={xFormatter}
                yFormatter={yFormatter}
              />
            )}
          />
          <Scatter data={data} shape={ScatterSymbol} isAnimationActive={false} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ThemedHorizontalBarChart({
  data,
  ariaLabel,
  color = chartPalette.moss,
  valueFormatter = defaultNumberFormatter,
  height = 260
}: {
  data: BarChartPoint[];
  ariaLabel: string;
  color?: string;
  valueFormatter?: (value: number) => string;
  height?: number;
}) {
  if (data.length === 0) {
    return <ChartEmptyState>Sem barras para renderizar.</ChartEmptyState>;
  }

  const chartHeight = Math.max(height, data.length * 42 + 44);

  return (
    <div style={{ height: chartHeight }}>
      <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={{ width: 640, height: chartHeight }}
      >
        <BarChart
          accessibilityLayer
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 12, bottom: 4, left: 12 }}
          role="img"
          aria-label={ariaLabel}
        >
          <CartesianGrid stroke={chartPalette.border} strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tick={{ fill: chartPalette.slate, fontSize: 12 }}
            tickFormatter={(value) => valueFormatter(Number(value))}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={116}
            tickLine={false}
            axisLine={false}
            tick={{ fill: chartPalette.slate, fontSize: 12 }}
          />
          <Tooltip content={(props) => <ThemedTooltip {...props} valueFormatter={valueFormatter} />} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} fill={color} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ThemedStackedBarChart({
  data,
  bars,
  ariaLabel,
  height = 220
}: {
  data: StackedBarPoint[];
  bars: Array<{ key: string; label: string; color: string }>;
  ariaLabel: string;
  height?: number;
}) {
  if (data.length === 0) {
    return <ChartEmptyState>Sem barras empilhadas para renderizar.</ChartEmptyState>;
  }

  const chartHeight = Math.max(height, data.length * 44 + 44);

  return (
    <div style={{ height: chartHeight }}>
      <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={{ width: 640, height: chartHeight }}
      >
        <BarChart
          accessibilityLayer
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 12, bottom: 4, left: 12 }}
          role="img"
          aria-label={ariaLabel}
        >
          <CartesianGrid stroke={chartPalette.border} strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={116}
            tickLine={false}
            axisLine={false}
            tick={{ fill: chartPalette.slate, fontSize: 12 }}
          />
          <Tooltip content={(props) => <StackedTooltip {...props} bars={bars} />} />
          {bars.map((bar, index) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              stackId="total"
              name={bar.label}
              fill={bar.color}
              radius={index === bars.length - 1 ? [0, 6, 6, 0] : [0, 0, 0, 0]}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ThemedInlineBarChart({
  value,
  max,
  ariaLabel,
  color = chartPalette.moss
}: {
  value: number;
  max: number;
  ariaLabel: string;
  color?: string;
}) {
  const safeMax = Math.max(max, value, 1);

  return (
    <div className="h-7 w-full min-w-28">
      <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={{ width: 140, height: 28 }}
      >
        <BarChart
          accessibilityLayer
          data={[{ name: ariaLabel, value }]}
          layout="vertical"
          margin={{ top: 6, right: 0, bottom: 6, left: 0 }}
          role="img"
          aria-label={ariaLabel}
        >
          <XAxis type="number" domain={[0, safeMax]} hide />
          <YAxis type="category" dataKey="name" hide />
          <Bar dataKey="value" fill={color} radius={[0, 5, 5, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ThemedHeatmapChart({
  data,
  ariaLabel,
  valueLabel = "peso",
  valueFormatter = (value) => `${defaultNumberFormatter(value)}%`,
  height = 260
}: {
  data: HeatmapPoint[];
  ariaLabel: string;
  valueLabel?: string;
  valueFormatter?: (value: number) => string;
  height?: number;
}) {
  if (data.length === 0) {
    return <ChartEmptyState>Sem células para renderizar o mapa.</ChartEmptyState>;
  }

  const rows = Array.from(new Set(data.map((point) => point.y)));
  const chartHeight = Math.max(height, rows.length * 42 + 56);

  return (
    <div style={{ height: chartHeight }}>
      <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={{ width: 640, height: chartHeight }}
      >
        <ScatterChart
          accessibilityLayer
          data={data}
          margin={{ top: 12, right: 12, bottom: 12, left: 12 }}
          role="img"
          aria-label={ariaLabel}
        >
          <CartesianGrid stroke={chartPalette.border} strokeDasharray="3 3" />
          <XAxis
            type="category"
            dataKey="x"
            tickLine={false}
            axisLine={false}
            tick={{ fill: chartPalette.slate, fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey="y"
            width={112}
            tickLine={false}
            axisLine={false}
            tick={{ fill: chartPalette.slate, fontSize: 12 }}
          />
          <ZAxis type="number" dataKey="value" range={[320, 320]} />
          <Tooltip
            content={(props) => (
              <HeatmapTooltip
                {...props}
                valueLabel={valueLabel}
                valueFormatter={valueFormatter}
              />
            )}
          />
          <Scatter data={data} shape={HeatmapSymbol} isAnimationActive={false} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

function ThemedTooltip({
  active,
  payload,
  label,
  valueFormatter
}: TooltipContentProps<TooltipValueType, string | number> & { valueFormatter: (value: number) => string }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <TooltipShell title={String(label ?? payload[0]?.payload?.name ?? "")}>
      {payload.map((entry) => (
        <TooltipLine
          key={String(entry.dataKey ?? entry.name)}
          label={String(entry.name ?? "valor")}
          value={valueFormatter(Number(entry.value ?? 0))}
          color={String(entry.color ?? chartPalette.moss)}
        />
      ))}
      {typeof payload[0]?.payload?.detail === "string" ? (
        <p className="mt-1 text-xs text-stone-500">{payload[0].payload.detail}</p>
      ) : null}
    </TooltipShell>
  );
}

function ScatterTooltip({
  active,
  payload,
  xLabel,
  yLabel,
  xFormatter,
  yFormatter
}: TooltipContentProps<TooltipValueType, string | number> & {
  xLabel: string;
  yLabel: string;
  xFormatter: (value: number) => string;
  yFormatter: (value: number) => string;
}) {
  if (!active || !payload?.length) {
    return null;
  }
  const point = payload[0]?.payload as ScatterChartPoint | undefined;
  if (!point) {
    return null;
  }

  return (
    <TooltipShell title={point.name}>
      <TooltipLine label={xLabel} value={xFormatter(point.x)} color={chartPalette.moss} />
      <TooltipLine label={yLabel} value={yFormatter(point.y)} color={chartPalette.blue} />
      {point.detail ? <p className="mt-1 text-xs text-stone-500">{point.detail}</p> : null}
    </TooltipShell>
  );
}

function StackedTooltip({
  active,
  payload,
  label,
  bars
}: TooltipContentProps<TooltipValueType, string | number> & {
  bars: Array<{ key: string; label: string; color: string }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <TooltipShell title={String(label ?? "")}>
      {bars.map((bar) => {
        const entry = payload.find((candidate) => candidate.dataKey === bar.key);
        return (
          <TooltipLine
            key={bar.key}
            label={bar.label}
            value={defaultNumberFormatter(Number(entry?.value ?? 0))}
            color={bar.color}
          />
        );
      })}
    </TooltipShell>
  );
}

function HeatmapTooltip({
  active,
  payload,
  valueLabel,
  valueFormatter
}: TooltipContentProps<TooltipValueType, string | number> & {
  valueLabel: string;
  valueFormatter: (value: number) => string;
}) {
  if (!active || !payload?.length) {
    return null;
  }
  const point = payload[0]?.payload as HeatmapPoint | undefined;
  if (!point) {
    return null;
  }

  return (
    <TooltipShell title={`${point.y} · ${point.x}`}>
      <TooltipLine label={valueLabel} value={valueFormatter(point.value)} color={point.fill ?? chartPalette.moss} />
      {point.detail ? <p className="mt-1 text-xs text-stone-500">{point.detail}</p> : null}
    </TooltipShell>
  );
}

function TooltipShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm">
      <p className="mb-1 max-w-56 truncate font-semibold text-stone-900">{title}</p>
      <div className="grid gap-1">{children}</div>
    </div>
  );
}

function TooltipLine({
  label,
  value,
  color
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="inline-flex items-center gap-2 text-stone-600">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span className="font-medium text-stone-900">{value}</span>
    </div>
  );
}

function ScatterSymbol(props: ScatterShapeProps) {
  const payload = props.payload as ScatterChartPoint | undefined;
  return (
    <Symbols
      {...props}
      type="circle"
      fill={payload?.fill ?? chartPalette.moss}
      stroke="#ffffff"
      strokeWidth={1.5}
    />
  );
}

function HeatmapSymbol(props: ScatterShapeProps) {
  const payload = props.payload as HeatmapPoint | undefined;
  return (
    <Symbols
      {...props}
      type="square"
      fill={payload?.fill ?? chartPalette.moss}
      fillOpacity={0.9}
      stroke="#ffffff"
      strokeWidth={1}
    />
  );
}

function ChartEmptyState({ children }: { children: React.ReactNode }) {
  return (
    <Alert
      variant="info"
      className="flex min-h-40 items-center rounded-md bg-blue-50/70"
    >
      <div className="space-y-1">
        <p className="font-semibold text-blue-950">Dados insuficientes</p>
        <p>{children}</p>
      </div>
    </Alert>
  );
}

function compactNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

function defaultNumberFormatter(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2
  }).format(value);
}
