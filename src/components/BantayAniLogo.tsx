import { Shield } from 'lucide-react';

interface BantayAniLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const BantayAniLogo = ({ size = 'md', showText = true }: BantayAniLogoProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
        <div className="absolute inset-0 bg-primary/20 rounded-lg blur-lg animate-pulse-slow" />
        <Shield className={`${sizeClasses[size]} text-primary relative z-10`} strokeWidth={1.5} />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`${textSizes[size]} font-bold text-foreground glow-text`}>
            BantayAni
          </span>
          {size !== 'sm' && (
            <span className="text-xs text-muted-foreground">
              Smart Agricultural Pest Detection
            </span>
          )}
        </div>
      )}
    </div>
  );
};
