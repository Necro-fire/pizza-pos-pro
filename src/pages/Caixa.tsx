import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { PinDialog } from '@/components/PinDialog';
import { CaixaStatusBar } from '@/components/caixa/CaixaStatusBar';
import { CaixaSummary } from '@/components/caixa/CaixaSummary';
import { CaixaActions } from '@/components/caixa/CaixaActions';
import { CaixaPaymentBreakdown } from '@/components/caixa/CaixaPaymentBreakdown';
import { CaixaMovementsTable } from '@/components/caixa/CaixaMovementsTable';
import { CaixaAuditLog } from '@/components/caixa/CaixaAuditLog';
import { MovementDialog, CloseDialog } from '@/components/caixa/CaixaDialogs';
import { buildUnifiedMovements, fmt, fmtDate } from '@/lib/caixa-utils';
import type { PaymentMethod, MovementType } from '@/types/pizzaria';

export default function Caixa() {
  const {
    cashRegister, cashHistory, openRegister, closeRegister,
    addMovement, deleteMovement, auditLogs, addAuditLog, pinUnlocked,
  } = useStore();

  const [initialAmount, setInitialAmount] = useState('');
  const [movType, setMovType] = useState<MovementType | null>(null);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [activeTab, setActiveTab] = useState<'movements' | 'audit'>('movements');

  const requirePin = (action: () => void) => {
    if (pinUnlocked) {
      action();
      return;
    }
    setPendingAction(() => action);
    setShowPinDialog(true);
  };

  const handleOpen = () => {
    const val = parseFloat(initialAmount);
    if (isNaN(val) || val < 0) { toast.error('Informe um valor válido'); return; }
    openRegister(val);
    setInitialAmount('');
    toast.success('Caixa aberto com sucesso');
  };

  const handleMovement = (amount: number, description: string, paymentMethod: PaymentMethod) => {
    if (!movType) return;
    addMovement({ type: movType, amount, description, paymentMethod, origin: 'manual' });
    addAuditLog(`MOVEMENT_${movType.toUpperCase()}`, `${description}: R$ ${amount.toFixed(2)}`);
    setMovType(null);
    toast.success('Movimentação registrada');
  };

  const handleClose = (informedAmount: number) => {
    setShowCloseDialog(false);
    closeRegister(informedAmount);
    toast.success('Caixa fechado com sucesso');
  };

  const handleDeleteMovement = (id: string) => {
    requirePin(() => {
      deleteMovement(id);
      toast.success('Movimentação removida');
    });
  };

  // --- Closed state ---
  if (!cashRegister || cashRegister.closedAt) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <div className="bg-card border border-border rounded-lg p-8 max-w-lg w-full space-y-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Abertura de Caixa</h2>
              <p className="text-xs text-muted-foreground">Informe o valor inicial para iniciar o turno</p>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-1 block">
              Valor Inicial (R$)
            </label>
            <Input
              type="number"
              placeholder="0,00"
              value={initialAmount}
              onChange={(e) => setInitialAmount(e.target.value)}
              className="bg-secondary text-foreground"
            />
          </div>

          <Button onClick={handleOpen} className="w-full">
            Abrir Caixa
          </Button>

          {/* Last closed session */}
          {cashRegister?.closedAt && (
            <div className="border-t border-border pt-4 space-y-2">
              <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Último Fechamento</p>
              <div className="text-sm space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Encerrado em</span>
                  <span className="text-foreground tabular-nums">{fmtDate(cashRegister.closedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vendas</span>
                  <span className="text-foreground">{cashRegister.sales.length}</span>
                </div>
                {cashRegister.informedAmount !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor informado</span>
                    <span className="text-foreground tabular-nums">{fmt(cashRegister.informedAmount)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* History */}
          {cashHistory.length > 0 && (
            <div className="border-t border-border pt-4 space-y-2">
              <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
                Histórico de Turnos ({cashHistory.length})
              </p>
              <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                {cashHistory.slice(-5).reverse().map((h) => (
                  <div key={h.id} className="flex justify-between text-xs text-muted-foreground py-1 border-b border-border/50">
                    <span className="tabular-nums">{fmtDate(h.openedAt)}</span>
                    <span>{h.sales.length} vendas</span>
                    <span className="text-foreground font-medium tabular-nums">
                      {fmt(h.sales.reduce((s, sale) => s + sale.total, 0))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Open state ---
  const movements = buildUnifiedMovements(
    cashRegister.entries, cashRegister.exits, cashRegister.sales
  );

  return (
    <div className="p-5 space-y-4 max-w-7xl mx-auto">
      <CaixaStatusBar cashRegister={cashRegister} />
      <CaixaSummary cashRegister={cashRegister} />
      <CaixaActions
        onEntry={() => setMovType('entry')}
        onExit={() => setMovType('exit')}
        onSangria={() => setMovType('sangria')}
        onReforco={() => setMovType('reforco')}
        onClose={() => requirePin(() => setShowCloseDialog(true))}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="flex gap-1 mb-3">
            {[
              { key: 'movements' as const, label: `Movimentações (${movements.length})` },
              { key: 'audit' as const, label: `Auditoria (${auditLogs.length})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {activeTab === 'movements' ? (
            <CaixaMovementsTable
              movements={movements}
              onDelete={handleDeleteMovement}
              canDelete={pinUnlocked}
            />
          ) : (
            <CaixaAuditLog logs={auditLogs} />
          )}
        </div>
        <CaixaPaymentBreakdown cashRegister={cashRegister} />
      </div>

      {/* Dialogs */}
      <MovementDialog
        open={!!movType}
        type={movType}
        onClose={() => setMovType(null)}
        onConfirm={handleMovement}
      />
      <CloseDialog
        open={showCloseDialog}
        cashRegister={cashRegister}
        onClose={() => setShowCloseDialog(false)}
        onConfirm={handleClose}
      />
      <PinDialog
        open={showPinDialog}
        onClose={() => { setShowPinDialog(false); setPendingAction(null); }}
        onSuccess={() => {
          setShowPinDialog(false);
          pendingAction?.();
          setPendingAction(null);
        }}
      />
    </div>
  );
}
