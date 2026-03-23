import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Product, Category } from '@/types/pizzaria';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PinDialog } from '@/components/PinDialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Edit, Eye, EyeOff, Lock, Search } from 'lucide-react';
import { toast } from 'sonner';
import { fmt } from '@/lib/caixa-utils';

const emptyProduct: Omit<Product, 'id'> = {
  name: '', category: 'pizza', image: '🍕', price: 0, cost: 0, active: true,
};

const categoryEmojis: Record<Category, string> = { pizza: '🍕', bebidas: '🥤', outros: '📦' };
const categoryLabels: Record<Category, string> = { pizza: 'Pizza', bebidas: 'Bebidas', outros: 'Outros' };

export default function Produtos() {
  const { products, addProduct, updateProduct, pinUnlocked, userRole } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [showPin, setShowPin] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<Category | 'all'>('all');

  const canSeeCost = userRole === 'admin' && pinUnlocked;

  const filtered = products
    .filter((p) => filterCat === 'all' || p.category === filterCat)
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const openNew = () => { setEditing(null); setForm(emptyProduct); setShowForm(true); };
  const openEdit = (p: Product) => {
    if (!canSeeCost) {
      setShowPin(true);
      return;
    }
    setEditing(p); setForm(p); setShowForm(true);
  };

  const save = () => {
    if (!form.name || form.price <= 0) { toast.error('Preencha nome e preço'); return; }
    if (editing) {
      updateProduct({ ...editing, ...form });
      toast.success('Produto atualizado');
    } else {
      addProduct({ ...form, id: crypto.randomUUID() });
      toast.success('Produto criado');
    }
    setShowForm(false);
  };

  return (
    <div className="p-5 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Produtos</h1>
        <div className="flex gap-2">
          {userRole === 'admin' && !pinUnlocked && (
            <Button onClick={() => setShowPin(true)} variant="outline" size="sm" className="gap-2 text-xs">
              <Lock className="w-3 h-3" /> Desbloquear custos
            </Button>
          )}
          <Button onClick={openNew} size="sm" className="gap-2 text-xs">
            <Plus className="w-3 h-3" /> Novo Produto
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 bg-secondary text-sm h-8"
          />
        </div>
        <div className="flex gap-1">
          {[
            { value: 'all' as const, label: 'Todos' },
            ...(['pizza', 'bebidas', 'outros'] as Category[]).map(c => ({
              value: c, label: `${categoryEmojis[c]} ${categoryLabels[c]}`
            })),
          ].map((c) => (
            <button
              key={c.value}
              onClick={() => setFilterCat(c.value)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                filterCat === c.value
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground w-10"></TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Nome</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Categoria</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground text-right">Preço</TableHead>
              {canSeeCost && (
                <>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground text-right">Custo</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground text-right">Lucro</TableHead>
                </>
              )}
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id} className={`hover:bg-secondary/30 ${!p.active ? 'opacity-50' : ''}`}>
                <TableCell className="text-xl py-2.5">{p.image}</TableCell>
                <TableCell className="text-sm font-medium py-2.5">{p.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground py-2.5 capitalize">{categoryLabels[p.category]}</TableCell>
                <TableCell className="text-sm text-right font-semibold tabular-nums py-2.5">{fmt(p.price)}</TableCell>
                {canSeeCost && (
                  <>
                    <TableCell className="text-sm text-right text-muted-foreground tabular-nums py-2.5">{fmt(p.cost)}</TableCell>
                    <TableCell className={`text-sm text-right font-semibold tabular-nums py-2.5 ${p.price - p.cost > 0 ? 'text-success' : 'text-destructive'}`}>
                      {fmt(p.price - p.cost)}
                    </TableCell>
                  </>
                )}
                <TableCell className="py-2.5">
                  <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                    p.active ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                  }`}>
                    {p.active ? 'Ativo' : 'Inativo'}
                  </span>
                </TableCell>
                <TableCell className="py-2.5">
                  <button onClick={() => openEdit(p)} className="text-muted-foreground hover:text-foreground transition-colors active:scale-95">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && (
          <div className="p-6 text-center text-xs text-muted-foreground">Nenhum produto encontrado</div>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-card border-border sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-sm">{editing ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-1 block">Nome</label>
              <Input placeholder="Nome do produto" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-secondary text-sm" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-1 block">Categoria</label>
              <div className="flex gap-2">
                {(['pizza', 'bebidas', 'outros'] as Category[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm({ ...form, category: c, image: categoryEmojis[c] })}
                    className={`flex-1 py-2 rounded text-xs font-medium transition-colors ${
                      form.category === c ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {categoryEmojis[c]} {categoryLabels[c]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-1 block">Preço de Venda</label>
              <Input type="number" placeholder="0,00" value={form.price || ''} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className="bg-secondary text-sm" />
            </div>
            {canSeeCost && (
              <div>
                <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-1 block">Custo</label>
                <Input type="number" placeholder="0,00" value={form.cost || ''} onChange={(e) => setForm({ ...form, cost: parseFloat(e.target.value) || 0 })} className="bg-secondary text-sm" />
              </div>
            )}
            <div className="flex items-center gap-3">
              <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Status</label>
              <button
                onClick={() => setForm({ ...form, active: !form.active })}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium ${
                  form.active ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                }`}
              >
                {form.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                {form.active ? 'Ativo' : 'Inativo'}
              </button>
            </div>
            <Button onClick={save} className="w-full text-sm font-semibold">
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PinDialog open={showPin} onClose={() => setShowPin(false)} onSuccess={() => setShowPin(false)} />
    </div>
  );
}
