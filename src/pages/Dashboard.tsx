import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { PinDialog } from '@/components/PinDialog';
import { TrendingUp, ShoppingBag, Receipt, PieChart, Lock, BarChart3 } from 'lucide-react';
import { fmt } from '@/lib/caixa-utils';

export default function Dashboard() {
  const { sales, products, pinUnlocked, userRole } = useStore();
  const [showPin, setShowPin] = useState(false);

  if (userRole !== 'admin') {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <div className="text-center text-muted-foreground space-y-3">
          <Lock className="w-10 h-10 mx-auto opacity-40" />
          <p className="text-sm font-medium">Acesso restrito a administradores</p>
        </div>
      </div>
    );
  }

  if (!pinUnlocked) {
    return (
      <>
        <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
              <BarChart3 className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground mb-1">Dashboard Analítico</p>
              <p className="text-xs text-muted-foreground">Insira o PIN administrativo para acessar</p>
            </div>
            <button
              onClick={() => setShowPin(true)}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors active:scale-[0.97]"
            >
              Inserir PIN
            </button>
          </div>
        </div>
        <PinDialog open={showPin} onClose={() => setShowPin(false)} onSuccess={() => setShowPin(false)} />
      </>
    );
  }

  const totalRevenue = sales.reduce((s, sale) => s + sale.total, 0);
  const totalSales = sales.length;
  const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
  const totalCost = sales.reduce(
    (s, sale) => s + sale.items.reduce((s2, i) => s2 + i.product.cost * i.quantity, 0),
    0
  );
  const profit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  // Payment breakdown
  const paymentTotals: Record<string, number> = {};
  sales.forEach((sale) => {
    sale.payments.forEach((p) => {
      paymentTotals[p.method] = (paymentTotals[p.method] || 0) + p.amount;
    });
  });

  const paymentLabels: Record<string, string> = {
    dinheiro: 'Dinheiro', pix: 'Pix', cartao: 'Cartão',
  };

  // Top products
  const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      if (!productSales[item.product.id]) {
        productSales[item.product.id] = { name: item.product.name, qty: 0, revenue: 0 };
      }
      productSales[item.product.id].qty += item.quantity;
      productSales[item.product.id].revenue += item.product.price * item.quantity;
    });
  });
  const topProducts = Object.values(productSales).sort((a, b) => b.qty - a.qty).slice(0, 8);

  const cards = [
    { label: 'Faturamento', value: fmt(totalRevenue), icon: TrendingUp, color: 'text-success' },
    { label: 'Total de Vendas', value: totalSales.toString(), icon: ShoppingBag, color: 'text-info' },
    { label: 'Ticket Médio', value: fmt(avgTicket), icon: Receipt, color: 'text-warning' },
    { label: 'Margem de Lucro', value: `${margin.toFixed(1)}%`, icon: PieChart, color: 'text-primary' },
  ];

  return (
    <div className="p-5 space-y-4 max-w-7xl mx-auto">
      <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{c.label}</span>
              <c.icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <p className="text-xl font-bold tabular-nums">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profit */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Resultado Financeiro</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Receita bruta</span>
              <span className="tabular-nums">{fmt(totalRevenue)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Custo produtos</span>
              <span className="text-destructive tabular-nums">− {fmt(totalCost)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-semibold">
              <span>Lucro líquido</span>
              <span className={`tabular-nums ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>{fmt(profit)}</span>
            </div>
          </div>
        </div>

        {/* Payment breakdown */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Por Forma de Pagamento</h3>
          {Object.keys(paymentTotals).length === 0 ? (
            <p className="text-xs text-muted-foreground">Sem dados</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(paymentTotals).map(([method, total]) => {
                const pct = totalRevenue > 0 ? (total / totalRevenue) * 100 : 0;
                return (
                  <div key={method}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{paymentLabels[method] || method}</span>
                      <span className="tabular-nums">{fmt(total)} <span className="text-muted-foreground text-xs">({pct.toFixed(0)}%)</span></span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary/60 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top products */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Produtos Mais Vendidos</h3>
          {topProducts.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sem dados</p>
          ) : (
            <div className="space-y-1.5">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between text-sm py-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-secondary text-[11px] flex items-center justify-center font-semibold text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="text-foreground text-xs">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground tabular-nums">{p.qty}×</span>
                    <span className="text-xs text-foreground tabular-nums font-medium">{fmt(p.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
