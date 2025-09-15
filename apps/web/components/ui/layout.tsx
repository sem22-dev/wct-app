import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  variant?: 'caller' | 'agent-a' | 'agent-b' | 'consultation';
  className?: string;
}

const variantConfig = {
  caller: {
    gradient: 'from-blue-600 via-blue-700 to-blue-800',
    icon: '',
    accent: 'blue'
  },
  'agent-a': {
    gradient: 'from-orange-600 via-red-600 to-red-700',
    icon: '',
    accent: 'orange'
  },
  'agent-b': {
    gradient: 'from-purple-600 via-indigo-600 to-indigo-700',
    icon: '',
    accent: 'purple'
  },
  consultation: {
    gradient: 'from-emerald-600 via-green-600 to-teal-700',
    icon: '',
    accent: 'emerald'
  }
};

export function Layout({ children, title, subtitle, variant = 'caller', className }: LayoutProps) {
  const config = variantConfig[variant];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className={cn('bg-gradient-to-r shadow-xl border-b', config.gradient)}>
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center space-x-4">
            <div className="text-4xl">{config.icon}</div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">{title}</h1>
              {subtitle && (
                <p className="text-blue-100 text-sm mt-1 font-medium">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={cn('container mx-auto px-6 py-8  ', className)}>
        {children}
      </div>

      {/* Footer Badge */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-white/20 text-sm text-slate-600 font-medium">
          LiveKit Warm Transfer Demo
        </div>
      </div>
    </div>
  );
}
