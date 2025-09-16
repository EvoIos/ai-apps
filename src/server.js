import { Hono } from 'hono';
import { serve } from '@hono/node-server';

const app = new Hono();

const page = `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>涨跌幅计算器</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="min-h-screen bg-slate-950 text-slate-100">
    <main class="max-w-3xl mx-auto px-4 py-12">
      <section class="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl shadow-slate-900/50 p-10">
        <div class="flex flex-col gap-6">
          <header>
            <p class="text-sm font-medium text-emerald-400 uppercase tracking-[0.3em]">Market Tools</p>
            <h1 class="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">涨跌幅计算器</h1>
            <p class="mt-3 text-base leading-relaxed text-slate-300">
              输入初始价格和最新价格，快速得到价格变化数值和涨跌幅百分比。
            </p>
          </header>

          <form id="change-form" class="grid gap-6 sm:grid-cols-2">
            <label class="flex flex-col gap-2">
              <span class="text-sm font-semibold text-slate-200">初始价格</span>
              <div class="relative">
                <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">¥</span>
                <input
                  id="startPrice"
                  name="startPrice"
                  type="number"
                  step="0.000001"
                  min="0"
                  required
                  class="w-full rounded-2xl border border-slate-700 bg-slate-950 py-3 pl-8 pr-4 text-base text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                  placeholder="例如：12.35"
                />
              </div>
            </label>

            <label class="flex flex-col gap-2">
              <span class="text-sm font-semibold text-slate-200">最新价格</span>
              <div class="relative">
                <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">¥</span>
                <input
                  id="endPrice"
                  name="endPrice"
                  type="number"
                  step="0.000001"
                  min="0"
                  required
                  class="w-full rounded-2xl border border-slate-700 bg-slate-950 py-3 pl-8 pr-4 text-base text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                  placeholder="例如：15.00"
                />
              </div>
            </label>

            <div class="sm:col-span-2 flex flex-col gap-3">
              <button
                type="submit"
                class="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
              >
                立即计算
                <span class="text-lg">→</span>
              </button>
              <p class="text-xs text-slate-500">
                温馨提示：初始价格为 0 时无法计算涨跌幅，请确保有有效数据。
              </p>
            </div>
          </form>

          <div id="result" class="grid gap-4 sm:grid-cols-2" aria-live="polite">
            <article class="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
              <p class="text-sm text-slate-400">价格变化</p>
              <p id="absoluteChange" class="mt-2 text-3xl font-semibold">--</p>
              <p id="directionLabel" class="mt-1 text-xs uppercase tracking-[0.3em] text-slate-500">等待输入</p>
            </article>
            <article class="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
              <p class="text-sm text-slate-400">涨跌幅</p>
              <p id="percentageChange" class="mt-2 text-3xl font-semibold">--</p>
              <p class="mt-1 text-xs uppercase tracking-[0.3em] text-slate-500">相对于初始价格</p>
            </article>
          </div>
        </div>
      </section>
    </main>

    <script>
      const form = document.getElementById('change-form');
      const startInput = document.getElementById('startPrice');
      const endInput = document.getElementById('endPrice');
      const absoluteChange = document.getElementById('absoluteChange');
      const percentageChange = document.getElementById('percentageChange');
      const directionLabel = document.getElementById('directionLabel');

      const MAX_DECIMAL_PLACES = 6;

      const limitDecimalPlaces = (value, decimalPlaces = MAX_DECIMAL_PLACES) => {
        if (value === 0) {
          return 0;
        }

        const factor = 10 ** decimalPlaces;
        const epsilonAdjusted = value + (value > 0 ? Number.EPSILON : -Number.EPSILON);
        const rounded = Math.round(epsilonAdjusted * factor) / factor;
        return Object.is(rounded, -0) ? 0 : rounded;
      };

      const formatCurrency = (value, withSign = false) => {
        if (!Number.isFinite(value)) {
          return '--';
        }

        const normalized = limitDecimalPlaces(value);
        const sign = normalized < 0 ? '-' : withSign && normalized > 0 ? '+' : '';
        const formattedNumber = Math.abs(normalized).toLocaleString('zh-CN', {
          minimumFractionDigits: 0,
          maximumFractionDigits: MAX_DECIMAL_PLACES
        });

        return sign + '¥' + formattedNumber;
      };

      const formatPercentage = (value) => {
        if (!Number.isFinite(value)) {
          return '--';
        }

        const normalized = limitDecimalPlaces(value);
        const sign = normalized > 0 ? '+' : normalized < 0 ? '-' : '';
        const formattedNumber = Math.abs(normalized).toLocaleString('zh-CN', {
          minimumFractionDigits: 0,
          maximumFractionDigits: MAX_DECIMAL_PLACES
        });

        return sign + formattedNumber + '%';
      };

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const start = parseFloat(startInput.value);
        const end = parseFloat(endInput.value);

        if (Number.isNaN(start) || Number.isNaN(end) || start <= 0) {
          absoluteChange.textContent = '--';
          percentageChange.textContent = '--';
          directionLabel.textContent = '数据无效';
          directionLabel.className = 'mt-1 text-xs uppercase tracking-[0.3em] text-rose-400';
          return;
        }

        const difference = end - start;
        const percent = (difference / start) * 100;
        const formattedDifference = formatCurrency(difference, true);
        const formattedPercent = formatPercentage(percent);

        absoluteChange.textContent = formattedDifference;
        percentageChange.textContent = formattedPercent;

        const direction = difference > 0 ? '上涨' : difference < 0 ? '下跌' : '持平';
        const directionColor = difference > 0 ? 'text-emerald-400' : difference < 0 ? 'text-rose-400' : 'text-slate-400';
        directionLabel.textContent = direction;
        directionLabel.className = 'mt-1 text-xs uppercase tracking-[0.3em] ' + directionColor;
      });
    </script>
  </body>
</html>`;

app.get('/', (c) => c.html(page));

const port = Number.parseInt(process.env.PORT ?? '3000', 10);

serve({
  fetch: app.fetch,
  port
});

console.log(`🚀 服务器已启动，访问 http://localhost:${port}`);
