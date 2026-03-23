import { useLocation, Link } from 'react-router-dom';
import { ShoppingCart, LayoutDashboard, Package, Wallet, Lock, Unlock, User } from 'lucide-react';
import { useStore } from '@/store/useStore';

const links = [
  { to: '/', label: 'PDV', icon: ShoppingCart },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/produtos', label: 'Produtos', icon: Package },
  { to: '/caixa', label: 'Caixa', icon: Wallet },
];

export function TopNav() {
  const { pathname } = useLocation();
  const { userRole, setUserRole, pinUnlocked, lockPin, cashRegister } = useStore();
  const isRegisterOpen = cashRegister && !cashRegister.closedAt;

  return (
    <nav className="h-12 bg-card border-b border-border flex items-center px-4 gap-1 shrink-0">
      <span className="text-primary font-extrabold text-sm tracking-tight mr-5 flex items-center gap-1.5">
        🍕 PizzaPDV
      </span>

      <div className="flex gap-0.5">
        {links.map((l) => {
          const active = pathname === l.to;
          if (l.to === '/dashboard' && userRole !== 'admin') return null;
          return (
            <Link
              key={l.to}
              to={l.to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <l.icon className="w-3.5 h-3.5" />
              {l.label}
              {l.to === '/caixa' && isRegisterOpen && (
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
              )}
            </Link>
          );
        })}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Register status indicator */}
        {isRegisterOpen && (
          <span className="text-[10px] text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded font-medium">
            Caixa Aberto
          </span>
        )}

        {/* Role switcher */}
        <button
          onClick={() => setUserRole(userRole === 'admin' ? 'employee' : 'admin')}
          className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded hover:text-foreground transition-colors"
        >
          <User className="w-3 h-3" />
          <span className="capitalize">{userRole === 'admin' ? 'Admin' : 'Funcionário'}</span>
        </button>

        {userRole === 'admin' && pinUnlocked && (
          <button onClick={lockPin} className="text-success hover:text-foreground transition-colors p-1" title="Bloquear PIN">
            <Unlock className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </nav>
  );
}
