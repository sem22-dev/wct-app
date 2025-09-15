import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ActionCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  variant?: 'default' | 'warning' | 'success' | 'info';
  icon?: ReactNode;
  className?: string;
}

const variantClasses = {
  default: 'bg-slate-50/80 border-slate-200/50',
  warning: 'bg-amber-50/80 border-amber-200/50',
  success: 'bg-emerald-50/80 border-emerald-200/50',
  info: 'bg-blue-50/80 border-blue-200/50'
};

export function ActionCard({ 
  title, 
  description, 
  children, 
  variant = 'default', 
  icon,
  className 
}: ActionCardProps) {
  return (
    <Card className={cn(
      'backdrop-blur-sm shadow-xl',
      variantClasses[variant],
      className
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-3 text-lg font-semibold text-slate-800">
          {icon && (
            <div className="flex items-center justify-center w-8 h-8 bg-white/50 rounded-lg">
              {icon}
            </div>
          )}
          <span>{title}</span>
        </CardTitle>
        {description && (
          <p className="text-sm text-slate-600 mt-1">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}
