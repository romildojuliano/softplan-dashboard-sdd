'use client';

import { useEffect, useRef } from 'react';
import {
  Chart,
  registerables,
  type ChartConfiguration,
  type ChartType,
  type Plugin,
} from 'chart.js';

interface TotalPilhaOptions {
  ativo?: boolean;
  eixo?: string;
  formato?: (value: number) => string;
  cor?: string;
  tamanho?: number;
  recuo?: number;
  peso?: number;
}

declare module 'chart.js' {
  interface PluginOptionsByType<TType extends ChartType> {
    totalPilha?: TType extends 'bar' ? TotalPilhaOptions : never;
  }
}

const totalPilha: Plugin<ChartType, TotalPilhaOptions> = {
  id: 'totalPilha',
  afterDatasetsDraw(chart, _args, options) {
    if (options.ativo !== true) return;

    const axisId = options.eixo || 'y';
    const axis = chart.scales[axisId];
    if (!axis) return;

    const datasets = chart.data.datasets;
    const labels = chart.data.labels ?? [];
    const context = chart.ctx;
    context.save();
    context.font = `${options.peso ?? 600} ${options.tamanho ?? 11}px 'Sora','Segoe UI',system-ui,sans-serif`;
    context.fillStyle = options.cor || '#FFFFFF';
    context.textAlign = 'center';
    context.textBaseline = 'bottom';

    for (let dataIndex = 0; dataIndex < labels.length; dataIndex += 1) {
      let total = 0;
      let x: number | undefined;

      for (let datasetIndex = 0; datasetIndex < datasets.length; datasetIndex += 1) {
        const dataset = datasets[datasetIndex];
        const datasetAxis = 'yAxisID' in dataset ? dataset.yAxisID : undefined;
        const meta = chart.getDatasetMeta(datasetIndex);
        if ((datasetAxis || 'y') !== axisId) continue;
        if (meta.type !== 'bar') continue;
        if (!chart.isDatasetVisible(datasetIndex)) continue;

        total += Number(dataset.data[dataIndex]) || 0;
        const element = meta.data[dataIndex];
        if (element) x = element.x;
      }

      if (!total || x === undefined) continue;
      context.fillText(
        options.formato ? options.formato(total) : String(total),
        x,
        axis.getPixelForValue(total) - (options.recuo ?? 8),
      );
    }

    context.restore();
  },
};


Chart.register(...registerables, totalPilha);

Chart.defaults.font.family = "'Sora','Segoe UI',system-ui,sans-serif";
Chart.defaults.font.size = 11;
Chart.defaults.color = '#9196AD';
Chart.defaults.borderColor = 'rgba(145,150,173,.20)';
Chart.defaults.animation = {
  ...(Chart.defaults.animation === false ? {} : Chart.defaults.animation),
  duration: 380,
};
Chart.defaults.plugins.legend.labels.boxWidth = 10;
Chart.defaults.plugins.legend.labels.boxHeight = 10;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.pointStyle = 'rect';
Chart.defaults.plugins.tooltip.backgroundColor = '#2B2F47';
Chart.defaults.plugins.tooltip.borderColor = 'rgba(145,150,173,.35)';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.titleColor = '#FFFFFF';
Chart.defaults.plugins.tooltip.bodyColor = '#DCDEEA';
Chart.defaults.plugins.tooltip.padding = 10;
Chart.defaults.plugins.tooltip.cornerRadius = 8;
Chart.defaults.plugins.tooltip.displayColors = true;
Chart.defaults.plugins.tooltip.boxPadding = 4;
Chart.defaults.maintainAspectRatio = false;

interface ChartCanvasProps<TType extends ChartType = ChartType> {
  config: ChartConfiguration<TType>;
  className?: string;
}

export function ChartCanvas<TType extends ChartType = ChartType>({
  config,
  className,
}: ChartCanvasProps<TType>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const chart = new Chart(canvasRef.current, config);
    return () => chart.destroy();
  }, [config]);

  return (
    <div className={className ? `chart ${className}` : 'chart'}>
      <canvas ref={canvasRef} />
    </div>
  );
}
